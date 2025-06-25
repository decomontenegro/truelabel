from PIL import Image, ImageDraw, ImageFont
import os

# Criar uma imagem de relatório de teste
img = Image.new('RGB', (800, 600), color='white')
draw = ImageDraw.Draw(img)

# Adicionar texto
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
except:
    font = ImageFont.load_default()

draw.text((50, 50), "RELATÓRIO DE ANÁLISE", fill='black', font=font)
draw.text((50, 100), "Laboratório: True Label", fill='black')
draw.text((50, 150), "Data: 06/10/2025", fill='black')
draw.text((50, 200), "Produto: Teste 001", fill='black')
draw.text((50, 250), "Resultado: APROVADO", fill='green')

# Adicionar uma tabela simples
draw.rectangle([50, 300, 750, 500], outline='black')
draw.line([50, 350, 750, 350], fill='black')
draw.text((60, 310), "Parâmetro", fill='black')
draw.text((400, 310), "Resultado", fill='black')
draw.text((60, 360), "Proteínas", fill='black')
draw.text((400, 360), "25g/100g", fill='black')
draw.text((60, 390), "Gorduras", fill='black')
draw.text((400, 390), "15g/100g", fill='black')

# Salvar as imagens
img.save('relatorio-teste.png')
img.save('relatorio-teste.jpg')

print("Imagens criadas com sucesso!")