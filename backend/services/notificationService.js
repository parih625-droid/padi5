const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    // Create transporter for sending emails
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'your_email@gmail.com',
        pass: process.env.SMTP_PASS || 'your_app_password'
      }
    });
  }

  // Send email notification to admin when order is placed
  async sendOrderPlacedNotification(order, user) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'your_email@gmail.com',
        to: process.env.ADMIN_EMAIL || 'admin@ecommerce.com',
        subject: `سفارش جدید - شماره سفارش: ${order.id}`,
        html: `
          <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb; text-align: center;">سفارش جدید ثبت شد</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">اطلاعات سفارش</h3>
              <p><strong>شماره سفارش:</strong> ${order.id}</p>
              <p><strong>تاریخ سفارش:</strong> ${new Date(order.created_at).toLocaleDateString('fa-IR')}</p>
              <p><strong>مبلغ کل:</strong> ${this.formatPrice(order.total_amount)} تومان</p>
              <p><strong>وضعیت:</strong> ${this.getOrderStatusText(order.status)}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">اطلاعات مشتری</h3>
              <p><strong>نام مشتری:</strong> ${order.customer_name}</p>
              <p><strong>تلفن:</strong> ${order.customer_phone}</p>
              <p><strong>آدرس:</strong> ${order.customer_address}</p>
              ${order.notes ? `<p><strong>یادداشت:</strong> ${order.notes}</p>` : ''}
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">آیتم‌های سفارش</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #2563eb; color: white;">
                    <th style="padding: 10px; text-align: right;">نام محصول</th>
                    <th style="padding: 10px; text-align: center;">تعداد</th>
                    <th style="padding: 10px; text-align: left;">قیمت واحد</th>
                    <th style="padding: 10px; text-align: left;">قیمت کل</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${this.formatPrice(item.price)} تومان</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${this.formatPrice(item.price * item.quantity)} تومان</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666;">لطفاً برای پیگیری سفارش به پنل مدیریت مراجعه کنید.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Admin notification email sent for order:', order.id);
    } catch (error) {
      console.error('❌ Failed to send admin notification email:', error);
    }
  }

  // Send email notification to admin when payment is completed
  async sendPaymentCompletedNotification(order, user) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'your_email@gmail.com',
        to: process.env.ADMIN_EMAIL || 'admin@ecommerce.com',
        subject: `پرداخت تکمیل شد - شماره سفارش: ${order.id}`,
        html: `
          <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981; text-align: center;">پرداخت سفارش تکمیل شد</h2>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981;">
              <h3 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">اطلاعات پرداخت</h3>
              <p><strong>شماره سفارش:</strong> ${order.id}</p>
              <p><strong>تاریخ پرداخت:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
              <p><strong>مبلغ پرداختی:</strong> ${this.formatPrice(order.total_amount)} تومان</p>
              <p><strong>شماره پیگیری:</strong> ${order.payment_ref_id || 'ندارد'}</p>
              <p><strong>وضعیت:</strong> پرداخت موفق</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">اطلاعات مشتری</h3>
              <p><strong>نام مشتری:</strong> ${order.customer_name}</p>
              <p><strong>تلفن:</strong> ${order.customer_phone}</p>
              <p><strong>آدرس:</strong> ${order.customer_address}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">آیتم‌های سفارش</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #2563eb; color: white;">
                    <th style="padding: 10px; text-align: right;">نام محصول</th>
                    <th style="padding: 10px; text-align: center;">تعداد</th>
                    <th style="padding: 10px; text-align: left;">قیمت واحد</th>
                    <th style="padding: 10px; text-align: left;">قیمت کل</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${this.formatPrice(item.price)} تومان</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${this.formatPrice(item.price * item.quantity)} تومان</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666;">سفارش جدید با موفقیت پرداخت شد. لطفاً برای ارسال سفارش اقدام کنید.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Payment completion notification email sent for order:', order.id);
    } catch (error) {
      console.error('❌ Failed to send payment completion notification email:', error);
    }
  }

  // Send email notification to customer when order is placed
  async sendOrderConfirmationToCustomer(order, user) {
    try {
      // Skip if user email is not available
      if (!user || !user.email) {
        console.log('Skipping customer notification - no email available');
        return;
      }

      const mailOptions = {
        from: process.env.SMTP_USER || 'your_email@gmail.com',
        to: user.email,
        subject: `تأیید سفارش - شماره سفارش: ${order.id}`,
        html: `
          <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb; text-align: center;">سفارش شما با موفقیت ثبت شد</h2>
            <p style="text-align: center; color: #666;">از خرید شما متشکریم. سفارش شما در حال پردازش است.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">اطلاعات سفارش</h3>
              <p><strong>شماره سفارش:</strong> ${order.id}</p>
              <p><strong>تاریخ سفارش:</strong> ${new Date(order.created_at).toLocaleDateString('fa-IR')}</p>
              <p><strong>مبلغ کل:</strong> ${this.formatPrice(order.total_amount)} تومان</p>
              <p><strong>وضعیت:</strong> ${this.getOrderStatusText(order.status)}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">اطلاعات تحویل</h3>
              <p><strong>نام گیرنده:</strong> ${order.customer_name}</p>
              <p><strong>تلفن تماس:</strong> ${order.customer_phone}</p>
              <p><strong>آدرس تحویل:</strong> ${order.customer_address}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">آیتم‌های سفارش</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #2563eb; color: white;">
                    <th style="padding: 10px; text-align: right;">نام محصول</th>
                    <th style="padding: 10px; text-align: center;">تعداد</th>
                    <th style="padding: 10px; text-align: left;">قیمت واحد</th>
                    <th style="padding: 10px; text-align: left;">قیمت کل</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.product_name}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${this.formatPrice(item.price)} تومان</td>
                      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${this.formatPrice(item.price * item.quantity)} تومان</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666;">ما به زودی اقدام به ارسال سفارش شما خواهیم کرد.</p>
              <p style="color: #666;">برای پیگیری سفارش به پنل کاربری خود مراجعه کنید.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Order confirmation email sent to customer:', user.email);
    } catch (error) {
      console.error('❌ Failed to send order confirmation email to customer:', error);
    }
  }

  // Helper function to format prices
  formatPrice(price) {
    // Convert to number and round
    const numericPrice = Math.round(parseFloat(price));
    
    // Handle NaN and invalid numbers
    if (isNaN(numericPrice)) {
      return '0';
    }
    
    // Format with Persian locale and return
    return numericPrice.toLocaleString('fa-IR');
  }

  // Helper function to get order status text
  getOrderStatusText(status) {
    const statusMap = {
      'pending': 'در انتظار پرداخت',
      'confirmed': 'تایید شده',
      'processing': 'در حال پردازش',
      'shipped': 'ارسال شده',
      'delivered': 'تحویل داده شده',
      'cancelled': 'لغو شده'
    };
    return statusMap[status] || status;
  }
}

module.exports = new NotificationService();