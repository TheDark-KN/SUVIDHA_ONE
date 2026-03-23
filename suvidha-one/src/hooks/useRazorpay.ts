import { useCallback } from "react";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
}

export const useRazorpay = () => {
  const openPaymentModal = useCallback((options: RazorpayOptions) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      const razorpayOptions = {
        key: options.key,
        amount: options.amount,
        currency: options.currency,
        order_id: options.orderId,
        name: "SUVIDHA ONE",
        description: options.description,
        customer_details: {
          name: options.customerName,
          email: options.customerEmail,
          contact: options.customerPhone,
        },
        handler: async (response: any) => {
          try {
            // Verify payment with backend
            const verifyResponse = await fetch(
              "/api/payment/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId: options.orderId,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              options.onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: options.orderId,
                signature: response.razorpay_signature,
              });
            } else {
              options.onError(verifyData);
            }
          } catch (error) {
            options.onError(error);
          }
        },
        prefill: {
          name: options.customerName,
          email: options.customerEmail,
          contact: options.customerPhone,
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new (window as any).Razorpay(razorpayOptions);
      rzp.open();
    };

    script.onerror = () => {
      options.onError("Failed to load Razorpay script");
    };

    document.body.appendChild(script);
  }, []);

  return { openPaymentModal };
};
