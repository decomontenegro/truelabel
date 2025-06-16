// Predictive Scaling Lambda Function
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();
const ecs = new AWS.ECS();
const applicationAutoscaling = new AWS.ApplicationAutoScaling();

// Configuration
const CLUSTER_NAME = process.env.ECS_CLUSTER_NAME;
const SERVICE_NAME = process.env.ECS_SERVICE_NAME;
const LOOKBACK_HOURS = parseInt(process.env.LOOKBACK_HOURS || '168');
const FORECAST_HOURS = parseInt(process.env.FORECAST_HOURS || '24');

// Statistical functions
function calculateMean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateStdDev(values, mean) {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(calculateMean(squaredDiffs));
}

function calculateTrend(values) {
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = calculateMean(values);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (values[i] - yMean);
        denominator += Math.pow(i - xMean, 2);
    }
    
    return denominator !== 0 ? numerator / denominator : 0;
}

// Get historical metrics
async function getHistoricalMetrics(metricName, namespace, dimensions) {
    const endTime = new Date();
    const startTime = new Date(endTime - LOOKBACK_HOURS * 60 * 60 * 1000);
    
    const params = {
        MetricName: metricName,
        Namespace: namespace,
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600, // 1 hour
        Statistics: ['Average'],
        Dimensions: dimensions
    };
    
    try {
        const data = await cloudwatch.getMetricStatistics(params).promise();
        return data.Datapoints.sort((a, b) => a.Timestamp - b.Timestamp);
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return [];
    }
}

// Analyze patterns
function analyzePatterns(datapoints) {
    if (datapoints.length < 24) {
        return { shouldScale: false, reason: 'Insufficient data' };
    }
    
    // Group by hour of day and day of week
    const hourlyPatterns = Array(24).fill(null).map(() => []);
    const dailyPatterns = Array(7).fill(null).map(() => []);
    
    datapoints.forEach(point => {
        const date = new Date(point.Timestamp);
        const hour = date.getHours();
        const day = date.getDay();
        
        hourlyPatterns[hour].push(point.Average);
        dailyPatterns[day].push(point.Average);
    });
    
    // Calculate averages and peaks
    const hourlyAverages = hourlyPatterns.map(hours => 
        hours.length > 0 ? calculateMean(hours) : 0
    );
    
    const dailyAverages = dailyPatterns.map(days => 
        days.length > 0 ? calculateMean(days) : 0
    );
    
    // Detect upcoming peak hours
    const currentHour = new Date().getHours();
    const nextHours = [];
    
    for (let i = 1; i <= FORECAST_HOURS; i++) {
        const hour = (currentHour + i) % 24;
        nextHours.push({
            hour: hour,
            expectedLoad: hourlyAverages[hour]
        });
    }
    
    // Find peak in next period
    const maxExpectedLoad = Math.max(...nextHours.map(h => h.expectedLoad));
    const currentLoad = datapoints[datapoints.length - 1]?.Average || 0;
    
    // Calculate if we need to scale
    const loadIncrease = (maxExpectedLoad - currentLoad) / currentLoad;
    const trend = calculateTrend(datapoints.slice(-24).map(d => d.Average));
    
    return {
        shouldScale: loadIncrease > 0.3 || trend > 0.5,
        expectedIncrease: Math.round(loadIncrease * 100),
        peakHour: nextHours.find(h => h.expectedLoad === maxExpectedLoad).hour,
        trend: trend,
        currentLoad: currentLoad,
        maxExpectedLoad: maxExpectedLoad,
        hourlyAverages: hourlyAverages,
        dailyAverages: dailyAverages
    };
}

// Calculate required capacity
function calculateRequiredCapacity(analysis, currentCapacity) {
    if (!analysis.shouldScale) {
        return currentCapacity;
    }
    
    // Calculate based on expected load increase
    const scaleFactor = 1 + (analysis.expectedIncrease / 100);
    const baseCapacity = Math.ceil(currentCapacity * scaleFactor);
    
    // Add buffer based on trend
    const trendBuffer = analysis.trend > 0 ? Math.ceil(analysis.trend * 2) : 0;
    
    // Ensure minimum capacity
    return Math.max(baseCapacity + trendBuffer, 2);
}

// Get current service configuration
async function getServiceInfo() {
    const params = {
        cluster: CLUSTER_NAME,
        services: [SERVICE_NAME]
    };
    
    try {
        const data = await ecs.describeServices(params).promise();
        if (data.services.length > 0) {
            return {
                desiredCount: data.services[0].desiredCount,
                runningCount: data.services[0].runningCount
            };
        }
    } catch (error) {
        console.error('Error describing service:', error);
    }
    
    return { desiredCount: 1, runningCount: 1 };
}

// Update scaling policy
async function updateScalingPolicy(minCapacity, maxCapacity) {
    const resourceId = `service/${CLUSTER_NAME}/${SERVICE_NAME}`;
    
    // Register scalable target with new limits
    const registerParams = {
        ServiceNamespace: 'ecs',
        ResourceId: resourceId,
        ScalableDimension: 'ecs:service:DesiredCount',
        MinCapacity: minCapacity,
        MaxCapacity: maxCapacity
    };
    
    try {
        await applicationAutoscaling.registerScalableTarget(registerParams).promise();
        console.log(`Updated scaling limits: min=${minCapacity}, max=${maxCapacity}`);
        return true;
    } catch (error) {
        console.error('Error updating scaling policy:', error);
        return false;
    }
}

// Main handler
exports.handler = async (event) => {
    console.log('Starting predictive scaling analysis...');
    
    try {
        // Get current service info
        const serviceInfo = await getServiceInfo();
        console.log('Current service info:', serviceInfo);
        
        // Define metrics to analyze
        const metricsToAnalyze = [
            {
                name: 'CPUUtilization',
                namespace: 'AWS/ECS',
                dimensions: [
                    { Name: 'ServiceName', Value: SERVICE_NAME },
                    { Name: 'ClusterName', Value: CLUSTER_NAME }
                ]
            },
            {
                name: 'MemoryUtilization',
                namespace: 'AWS/ECS',
                dimensions: [
                    { Name: 'ServiceName', Value: SERVICE_NAME },
                    { Name: 'ClusterName', Value: CLUSTER_NAME }
                ]
            },
            {
                name: 'RequestCountPerTarget',
                namespace: 'AWS/ApplicationELB',
                dimensions: [] // Add your ALB dimensions
            }
        ];
        
        // Analyze each metric
        const analyses = await Promise.all(
            metricsToAnalyze.map(async metric => {
                const data = await getHistoricalMetrics(
                    metric.name,
                    metric.namespace,
                    metric.dimensions
                );
                return {
                    metric: metric.name,
                    analysis: analyzePatterns(data)
                };
            })
        );
        
        console.log('Analyses:', JSON.stringify(analyses, null, 2));
        
        // Determine if we should scale
        const shouldScale = analyses.some(a => a.analysis.shouldScale);
        
        if (shouldScale) {
            // Find the most aggressive scaling requirement
            const maxRequiredCapacity = Math.max(
                ...analyses.map(a => 
                    calculateRequiredCapacity(a.analysis, serviceInfo.desiredCount)
                )
            );
            
            console.log(`Predictive scaling: recommending capacity of ${maxRequiredCapacity}`);
            
            // Update scaling policy
            const minCapacity = Math.max(2, Math.floor(maxRequiredCapacity * 0.7));
            const maxCapacity = Math.ceil(maxRequiredCapacity * 1.5);
            
            await updateScalingPolicy(minCapacity, maxCapacity);
            
            // Send notification
            const message = {
                action: 'SCALE_PREDICTION',
                service: SERVICE_NAME,
                currentCapacity: serviceInfo.desiredCount,
                recommendedCapacity: maxRequiredCapacity,
                analyses: analyses.map(a => ({
                    metric: a.metric,
                    trend: a.analysis.trend,
                    expectedIncrease: a.analysis.expectedIncrease
                }))
            };
            
            console.log('Scaling prediction:', message);
            
            // Publish to SNS for notifications
            // await publishToSNS(message);
        } else {
            console.log('No predictive scaling needed at this time');
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Predictive scaling analysis complete',
                shouldScale: shouldScale,
                analyses: analyses
            })
        };
        
    } catch (error) {
        console.error('Error in predictive scaling:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error in predictive scaling',
                error: error.message
            })
        };
    }
};