const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PixBR } = require('pixbrasil');
const { qrGenerator } = require('../lib/qrcode.lib');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { pixKey } = req.body;

    if (!pixKey) {
      return res.status(400).json({ error: 'Chave Pix é obrigatória.' });
    }

    const newDirPath = path.join(__dirname, '..', 'qrcodes');
    const randomName = crypto.randomBytes(16).toString('hex');
    const qrImagePath = path.join(newDirPath, `${randomName}.png`);

    if (!fs.existsSync(newDirPath)) {
      fs.mkdirSync(newDirPath, { recursive: true });
    }

    const payload = PixBR({
      key: pixKey,
      amount: 0, // O valor não está mais sendo passado
      name: 'BOLOTAS APOSTAS',
      city: 'SAO PAULO',
    });

    const codigoPix = payload;
    if (!codigoPix) {
      console.error('Erro: Código Pix está vazio.');
      return res.status(500).json({ error: 'Erro ao gerar o código Pix.' });
    }

    const qrGen = new qrGenerator({ imagePath: './lib/payment.png' });

    try {
      const qrCodeBase64 = await qrGen.generate(codigoPix);

      if (!qrCodeBase64 || !qrCodeBase64.response) {
        throw new Error('Erro ao gerar o QR Code: Resposta não encontrada.');
      }

      const qrBuffer = Buffer.from(qrCodeBase64.response, 'base64');
      fs.writeFileSync(qrImagePath, qrBuffer);

      const qrCodeImage = `<img src="data:image/png;base64,${qrBuffer.toString('base64')}" alt="QR Code Pix" width="128" height="128"/>`;

      res.status(200).json({
        success: true,
        qrCodeImage,
        message: 'QR Code gerado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao gerar o QR Code:', error);
      res.status(500).json({ error: `Erro ao gerar o QR Code: ${error.message}` });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido.' });
  }
};
