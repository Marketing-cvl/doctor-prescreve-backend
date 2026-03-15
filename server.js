const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook Mercado Pago - Notificação de Pagamento
app.post('/webhooks/mercadopago', async (req, res) => {
  try {
    const { action, data } = req.body;
    
    if (action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data.id;
      
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
          }
        }
      );

      const payment = response.data;
      
      if (payment.status === 'approved') {
        console.log(`✅ Pagamento aprovado: ${paymentId}`);
      }
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error);
    res.sendStatus(500);
  }
});

// Endpoint para iniciar avaliação médica
app.post('/api/medical-review/start', async (req, res) => {
  try {
    const { patient_cpf, doctor_name, doctor_crm } = req.body;
    console.log(`👨‍⚕️ Avaliação médica iniciada - CPF: ${patient_cpf}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao iniciar avaliação:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para decisão médica
app.post('/api/medical-review/decision', async (req, res) => {
  try {
    const { patient_cpf, decision, rejection_reason, prescription_id } = req.body;
    console.log(`📋 Decisão médica - CPF: ${patient_cpf} - Decisão: ${decision}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar decisão:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para processar estorno
app.post('/api/refund/process', async (req, res) => {
  try {
    const { payment_id, reason, amount } = req.body;
    const refundAmount = amount * 0.5;
    console.log(`💰 Processando estorno - Pagamento: ${payment_id} - Valor: R$ ${refundAmount}`);
    res.json({ success: true, refund_amount: refundAmount });
  } catch (error) {
    console.error('Erro ao processar estorno:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Doctor Prescreve Backend rodando na porta ${PORT}`);
});