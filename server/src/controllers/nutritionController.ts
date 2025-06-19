import { Request, Response } from 'express';
import { nutritionService } from '../services/nutritionService';
import logger from '../utils/logger';

class NutritionController {
  /**
   * Get daily nutritional values by country
   */
  async getDailyValues(req: Request, res: Response) {
    try {
      const { country } = req.params;
      const dailyValues = await nutritionService.getDailyValuesByCountry(country);
      
      if (!dailyValues) {
        return res.status(404).json({
          success: false,
          message: 'Daily values not found for this country'
        });
      }

      res.json({
        success: true,
        data: dailyValues
      });
    } catch (error) {
      logger.error('Error getting daily values:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving daily nutritional values'
      });
    }
  }

  /**
   * Calculate nutritional score for a product
   */
  async calculateNutritionalScore(req: Request, res: Response) {
    try {
      const { nutritionalInfo, servingSize, country } = req.body;
      
      const score = await nutritionService.calculateScore({
        nutritionalInfo,
        servingSize: servingSize || 100,
        country: country || 'BRAZIL'
      });

      res.json({
        success: true,
        data: score
      });
    } catch (error) {
      logger.error('Error calculating nutritional score:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating nutritional score'
      });
    }
  }

  /**
   * Analyze nutritional information and provide recommendations
   */
  async analyzeNutrition(req: Request, res: Response) {
    try {
      const { nutritionalInfo, category, targetAudience } = req.body;
      
      const analysis = await nutritionService.analyzeNutrition({
        nutritionalInfo,
        category,
        targetAudience: targetAudience || 'general'
      });

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('Error analyzing nutrition:', error);
      res.status(500).json({
        success: false,
        message: 'Error analyzing nutritional information'
      });
    }
  }

  /**
   * Validate nutritional claims
   */
  async validateClaims(req: Request, res: Response) {
    try {
      const { nutritionalInfo, claims, country } = req.body;
      
      const validationResults = await nutritionService.validateClaims({
        nutritionalInfo,
        claims,
        country: country || 'BRAZIL'
      });

      res.json({
        success: true,
        data: validationResults
      });
    } catch (error) {
      logger.error('Error validating claims:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating nutritional claims'
      });
    }
  }

  /**
   * Compare nutritional profiles
   */
  async compareProducts(req: Request, res: Response) {
    try {
      const { products } = req.body;
      
      const comparison = await nutritionService.compareProducts(products);

      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      logger.error('Error comparing products:', error);
      res.status(500).json({
        success: false,
        message: 'Error comparing nutritional profiles'
      });
    }
  }
}

const nutritionController = new NutritionController();
export default nutritionController;