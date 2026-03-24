import { NextRequest, NextResponse } from "next/server";

// Razorpay Test Credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_SUudTNZw53zapl";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "IVUVTIg3K0J2tps1uLXf3A3g";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, bills, customerName, customerEmail, customerPhone } = body;

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Convert to paise
    const amountPaise = Math.round(amount * 100);

    // Create Razorpay order directly
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
    
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `suvidha_${Date.now()}`,
        notes: {
          bills: bills || "",
          source: "suvidha_one_frontend",
          customerName: customerName || "Citizen",
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json().catch(() => ({}));
      console.error("Razorpay order creation error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.description || "Failed to create payment order" },
        { status: razorpayResponse.status }
      );
    }

    const order = await razorpayResponse.json();

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      customerName: customerName || "Citizen",
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "",
      receipt: order.receipt,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
