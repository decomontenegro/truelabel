import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { nutritionController } from '../controllers/nutritionController';
import { validateRequest } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Nutrition
 *   description: Nutrition information management
 */

/**
 * @swagger
 * /nutrition/daily-values/{country}:
 *   get:
 *     summary: Get daily nutritional values by country
 *     tags: [Nutrition]
 *     parameters:
 *       - in: path
 *         name: country
 *         required: true
 *         schema:
 *           type: string
 *           enum: [BRAZIL, USA, EU, CANADA, MEXICO]
 *         description: Country code for nutritional guidelines
 *     responses:
 *       200:
 *         description: Daily nutritional values for the specified country
 *       404:
 *         description: Country not found
 */
router.get(
  '/daily-values/:country',
  param('country').isIn(['BRAZIL', 'USA', 'EU', 'CANADA', 'MEXICO']),
  validateRequest,
  nutritionController.getDailyValues
);

/**
 * @swagger
 * /nutrition/calculate-score:
 *   post:
 *     summary: Calculate nutritional score for a product
 *     tags: [Nutrition]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nutritionalInfo:
 *                 type: object
 *                 description: Nutritional information per 100g
 *               servingSize:
 *                 type: number
 *                 description: Serving size in grams
 *               country:
 *                 type: string
 *                 enum: [BRAZIL, USA, EU, CANADA, MEXICO]
 *     responses:
 *       200:
 *         description: Nutritional score and analysis
 */
router.post(
  '/calculate-score',
  authMiddleware,
  [
    body('nutritionalInfo').isObject(),
    body('servingSize').isNumeric().optional(),
    body('country').isIn(['BRAZIL', 'USA', 'EU', 'CANADA', 'MEXICO']).optional()
  ],
  validateRequest,
  nutritionController.calculateNutritionalScore
);

/**
 * @swagger
 * /nutrition/analyze:
 *   post:
 *     summary: Analyze nutritional information and provide recommendations
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nutritionalInfo:
 *                 type: object
 *               category:
 *                 type: string
 *               targetAudience:
 *                 type: string
 *                 enum: [general, children, elderly, athletes]
 *     responses:
 *       200:
 *         description: Nutritional analysis and recommendations
 */
router.post(
  '/analyze',
  authMiddleware,
  [
    body('nutritionalInfo').isObject(),
    body('category').isString().optional(),
    body('targetAudience').isIn(['general', 'children', 'elderly', 'athletes']).optional()
  ],
  validateRequest,
  nutritionController.analyzeNutrition
);

/**
 * @swagger
 * /nutrition/validate-claims:
 *   post:
 *     summary: Validate nutritional claims against product data
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nutritionalInfo:
 *                 type: object
 *               claims:
 *                 type: array
 *                 items:
 *                   type: string
 *               country:
 *                 type: string
 *     responses:
 *       200:
 *         description: Claim validation results
 */
router.post(
  '/validate-claims',
  authMiddleware,
  [
    body('nutritionalInfo').isObject(),
    body('claims').isArray(),
    body('country').isString().optional()
  ],
  validateRequest,
  nutritionController.validateClaims
);

/**
 * @swagger
 * /nutrition/compare:
 *   post:
 *     summary: Compare nutritional profiles of multiple products
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nutritionalInfo:
 *                       type: object
 *     responses:
 *       200:
 *         description: Nutritional comparison results
 */
router.post(
  '/compare',
  authMiddleware,
  [
    body('products').isArray().withMessage('Products array is required'),
    body('products.*.id').isString(),
    body('products.*.nutritionalInfo').isObject()
  ],
  validateRequest,
  nutritionController.compareProducts
);

export default router;