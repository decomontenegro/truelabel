import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

// Import the service directly to avoid controller issues
import { nutritionService } from '../services/nutritionService';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Nutrition
 *   description: Nutrition information management
 */

/**
 * Get daily nutritional values by country
 */
router.get(
  '/daily-values/:country',
  param('country').isIn(['BRAZIL', 'USA', 'EU', 'CANADA', 'MEXICO']),
  validateRequest,
  async (req: Request, res: Response) => {
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
      console.error('Error getting daily values:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving daily nutritional values'
      });
    }
  }
);

/**
 * Calculate nutritional score for a product
 */
router.post(
  '/calculate-score',
  authenticateToken,
  [
    body('nutritionalInfo').isObject(),
    body('servingSize').isNumeric().optional(),
    body('country').isIn(['BRAZIL', 'USA', 'EU', 'CANADA', 'MEXICO']).optional()
  ],
  validateRequest,
  async (req: Request, res: Response) => {
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
      console.error('Error calculating nutritional score:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating nutritional score'
      });
    }
  }
);

/**
 * Analyze nutritional information and provide recommendations
 */
router.post(
  '/analyze',
  authenticateToken,
  [
    body('nutritionalInfo').isObject(),
    body('category').isString().optional(),
    body('targetAudience').isIn(['general', 'children', 'elderly', 'athletes']).optional()
  ],
  validateRequest,
  async (req: Request, res: Response) => {
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
      console.error('Error analyzing nutrition:', error);
      res.status(500).json({
        success: false,
        message: 'Error analyzing nutritional information'
      });
    }
  }
);

/**
 * Validate nutritional claims against product data
 */
router.post(
  '/validate-claims',
  authenticateToken,
  [
    body('nutritionalInfo').isObject(),
    body('claims').isArray(),
    body('country').isString().optional()
  ],
  validateRequest,
  async (req: Request, res: Response) => {
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
      console.error('Error validating claims:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating nutritional claims'
      });
    }
  }
);

/**
 * Compare nutritional profiles of multiple products
 */
router.post(
  '/compare',
  authenticateToken,
  [
    body('products').isArray().withMessage('Products array is required'),
    body('products.*.id').isString(),
    body('products.*.nutritionalInfo').isObject()
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { products } = req.body;
      
      const comparison = await nutritionService.compareProducts(products);

      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      console.error('Error comparing products:', error);
      res.status(500).json({
        success: false,
        message: 'Error comparing nutritional profiles'
      });
    }
  }
);

export default router;