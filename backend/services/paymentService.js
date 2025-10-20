const axios = require('axios');

// Add timeout to axios requests
axios.defaults.timeout = 10000; // 10 seconds

class PaymentService {
  // ZarinPal Payment Gateway Integration
  static async initializeZarinPalPayment(amount, description, email, mobile) {
    try {
      console.log('=== ZARINPAL PAYMENT INITIALIZATION ===');
      console.log('Amount:', amount);
      console.log('Description:', description);
      console.log('Email:', email);
      console.log('Mobile:', mobile);
      
      const zarinpalConfig = {
        merchant_id: process.env.ZARINPAL_MERCHANT_ID || 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
        amount: amount, // Amount in Rials
        callback_url: process.env.ZARINPAL_CALLBACK_URL || 'http://localhost:3000/payment/callback',
        description: description,
        email: email,
        mobile: mobile
      };
      
      console.log('ZarinPal config:', zarinpalConfig);

      const response = await axios.post('https://api.zarinpal.com/pg/v4/payment/request.json', zarinpalConfig);
      
      console.log('ZarinPal response:', response.data);

      if (response.data.data && response.data.data.code === 100) {
        console.log('ZarinPal payment initialization successful');
        return {
          success: true,
          authority: response.data.data.authority,
          paymentUrl: `https://www.zarinpal.com/pg/StartPay/${response.data.data.authority}`
        };
      } else {
        console.error('ZarinPal payment initialization failed:', response.data);
        return {
          success: false,
          error: 'Payment initialization failed',
          code: response.data.errors?.code
        };
      }
    } catch (error) {
      console.error('ZarinPal payment error:', error);
      return {
        success: false,
        error: 'Payment service unavailable'
      };
    }
  }

  // Verify ZarinPal Payment
  static async verifyZarinPalPayment(authority, amount) {
    try {
      console.log('=== ZARINPAL PAYMENT VERIFICATION ===');
      console.log('Authority:', authority);
      console.log('Amount:', amount);
      
      const verifyConfig = {
        merchant_id: process.env.ZARINPAL_MERCHANT_ID || 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
        authority: authority,
        amount: amount
      };
      
      console.log('ZarinPal verify config:', verifyConfig);

      const startTime = Date.now();
      const response = await axios.post('https://api.zarinpal.com/pg/v4/payment/verify.json', verifyConfig);
      const endTime = Date.now();
      
      console.log('ZarinPal verification response:', response.data);
      console.log('Verification request duration:', endTime - startTime, 'ms');

      if (response.data.data && response.data.data.code === 100) {
        console.log('ZarinPal payment verification successful');
        return {
          success: true,
          refId: response.data.data.ref_id,
          cardHash: response.data.data.card_hash,
          cardPan: response.data.data.card_pan
        };
      } else {
        console.error('ZarinPal payment verification failed:', response.data);
        return {
          success: false,
          error: 'Payment verification failed',
          code: response.data.errors?.code
        };
      }
    } catch (error) {
      console.error('ZarinPal verification error:', error);
      return {
        success: false,
        error: 'Payment verification failed'
      };
    }
  }

  // Mellat Bank Payment Gateway (Sample Implementation)
  static async initializeMellatPayment(amount, orderId, callbackUrl) {
    try {
      // This is a simplified implementation
      // In production, you would use proper Mellat Bank API
      const mellatConfig = {
        terminalId: process.env.MELLAT_TERMINAL_ID || '123456',
        userName: process.env.MELLAT_USERNAME || 'username',
        userPassword: process.env.MELLAT_PASSWORD || 'password',
        orderId: orderId,
        amount: amount * 10, // Mellat expects amount in Rials * 10
        localDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        localTime: new Date().toTimeString().slice(0, 8).replace(/:/g, ''),
        additionalData: '',
        callBackUrl: callbackUrl,
        payerId: 0
      };

      // Mock response for demo - replace with actual Mellat API call
      return {
        success: true,
        refId: 'MOCK_' + Date.now(),
        paymentUrl: `https://bpm.shaparak.ir/pgwchannel/startpay.mellat?RefId=MOCK_${Date.now()}`
      };
    } catch (error) {
      console.error('Mellat payment error:', error);
      return {
        success: false,
        error: 'Payment initialization failed'
      };
    }
  }

  // Parsian Bank Payment Gateway (Sample Implementation)
  static async initializeParsianPayment(amount, orderId, callbackUrl) {
    try {
      // Mock implementation for demo
      return {
        success: true,
        token: 'PARSIAN_' + Date.now(),
        paymentUrl: `https://pec.shaparak.ir/NewIPGServices/Sale/Sale?token=PARSIAN_${Date.now()}`
      };
    } catch (error) {
      console.error('Parsian payment error:', error);
      return {
        success: false,
        error: 'Payment initialization failed'
      };
    }
  }

  // Sadad Payment Gateway (Sample Implementation)
  static async initializeSadadPayment(amount, orderId, callbackUrl) {
    try {
      // Mock implementation for demo
      return {
        success: true,
        token: 'SADAD_' + Date.now(),
        paymentUrl: `https://sadad.shaparak.ir/VPG/Purchase?token=SADAD_${Date.now()}`
      };
    } catch (error) {
      console.error('Sadad payment error:', error);
      return {
        success: false,
        error: 'Payment initialization failed'
      };
    }
  }

  // Generic payment initialization based on gateway - Only Mellat Bank
  static async initializePayment(gateway, amount, orderId, userInfo, callbackUrl) {
    console.log('=== PAYMENT SERVICE INITIALIZATION ===');
    console.log('Gateway:', gateway);
    console.log('Amount:', amount);
    console.log('OrderId:', orderId);
    console.log('UserInfo:', userInfo);
    console.log('CallbackUrl:', callbackUrl);
    
    // Only support Mellat Bank
    if (gateway !== 'mellat') {
      console.error('Unsupported payment gateway:', gateway);
      return {
        success: false,
        error: 'Only Mellat Bank is supported'
      };
    }
    
    console.log('Initializing Mellat payment');
    return await this.initializeMellatPayment(amount, orderId, callbackUrl);
  }

  // Verify payment based on gateway - Only Mellat Bank
  static async verifyPayment(gateway, verificationData) {
    console.log('=== PAYMENT SERVICE VERIFICATION ===');
    console.log('Gateway:', gateway);
    console.log('Verification Data:', verificationData);
    
    // Only support Mellat Bank
    if (gateway !== 'mellat') {
      console.error('Payment verification not implemented for gateway:', gateway);
      return {
        success: false,
        error: 'Only Mellat Bank is supported'
      };
    }
    
    // For now, we'll just return a success response for Mellat
    // In a real implementation, you would verify with the bank's API
    console.log('Verifying Mellat payment');
    return {
      success: true,
      refId: 'MELLAT_' + Date.now()
    };
  }
}

module.exports = PaymentService;