from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle

def create_test_pdf():
    # Criar o canvas do PDF
    c = canvas.Canvas("relatorio-teste.pdf", pagesize=A4)
    width, height = A4
    
    # Título
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, "RELATÓRIO DE ANÁLISE")
    
    # Informações do cabeçalho
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 100, "Laboratório: True Label Análises")
    c.drawString(50, height - 120, "Data: 06/10/2025")
    c.drawString(50, height - 140, "Produto: Produto Teste PDF")
    c.drawString(50, height - 160, "Lote: LT2025PDF001")
    
    # Linha divisória
    c.line(50, height - 180, width - 50, height - 180)
    
    # Resultados
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 210, "Resultados da Análise Nutricional:")
    
    c.setFont("Helvetica", 11)
    y_position = height - 240
    
    # Dados nutricionais
    data = [
        ["Parâmetro", "Resultado", "Unidade"],
        ["Proteínas", "28.5", "g/100g"],
        ["Carboidratos", "42.3", "g/100g"],
        ["Gorduras Totais", "18.7", "g/100g"],
        ["Fibras", "6.2", "g/100g"],
        ["Sódio", "180", "mg/100g"]
    ]
    
    # Desenhar tabela manualmente
    for i, row in enumerate(data):
        for j, cell in enumerate(row):
            if i == 0:
                c.setFont("Helvetica-Bold", 11)
            else:
                c.setFont("Helvetica", 11)
            c.drawString(50 + j * 150, y_position - i * 20, cell)
    
    # Conclusão
    c.setFont("Helvetica-Bold", 12)
    c.setFillColorRGB(0, 0.5, 0)  # Verde
    c.drawString(50, height - 400, "CONCLUSÃO: PRODUTO APROVADO")
    
    # Assinatura
    c.setFillColorRGB(0, 0, 0)  # Preto
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 500, "_" * 40)
    c.drawString(50, height - 520, "Dr. João Silva")
    c.drawString(50, height - 540, "CRQ: 12345")
    c.drawString(50, height - 560, "Responsável Técnico")
    
    # Salvar o PDF
    c.save()
    print("PDF criado com sucesso!")

if __name__ == "__main__":
    try:
        create_test_pdf()
    except ImportError:
        print("Instalando reportlab...")
        import subprocess
        subprocess.check_call(["pip3", "install", "reportlab"])
        create_test_pdf()