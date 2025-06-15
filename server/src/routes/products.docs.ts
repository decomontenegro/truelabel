/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar produtos
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/sortParam'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VALIDATED, REJECTED, EXPIRED]
 *         description: Filtrar por status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Criar novo produto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - brand
 *               - category
 *               - sku
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               brand:
 *                 type: string
 *                 minLength: 2
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               sku:
 *                 type: string
 *               batchNumber:
 *                 type: string
 *               nutritionalInfo:
 *                 type: object
 *               claims:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obter produto por ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Detalhes do produto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Atualizar produto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               nutritionalInfo:
 *                 type: object
 *               claims:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Produto atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Deletar produto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto deletado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produto deletado com sucesso
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /products/{id}/qr-code:
 *   post:
 *     summary: Gerar QR code para produto
 *     tags: [Products, QR Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: QR code gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCode:
 *                   type: string
 *                   description: Código único do QR
 *                 qrCodeUrl:
 *                   type: string
 *                   format: uri
 *                   description: URL para acessar o QR code
 *                 qrCodeImage:
 *                   type: string
 *                   format: base64
 *                   description: Imagem do QR code em base64
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */