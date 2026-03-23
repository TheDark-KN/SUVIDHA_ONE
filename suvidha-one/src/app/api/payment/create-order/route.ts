import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, customerName, customerEmail, customerPhone, service_type, kiosk_id } =
      body;

    if (!amount || !service_type) {
      return NextResponse.json(
        { error: "Missing required fields: amount and service_type" },
        { status: 400 }
      );
    }

    // Validate amount (₹10 - ₹5000)
    const amountPaise = Math.round(amount * 100);
    if (amountPaise < 1000 || amountPaise > 500000) {
      return NextResponse.json(
        { error: "Amount must be between ₹10 and ₹5000" },
        { status: 400 }
      );
    }

    // Call backend payment service to create Razorpay order
    const backendResponse = await fetch(`${API_BASE_URL}/payment/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: customerPhone || "9999999999", // Fallback for kiosk mode
        amount: amountPaise,
        service_type: service_type,
        kiosk_id: kiosk_id || "WEB",
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error("Backend payment creation error:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create payment order" },
        { status: backendResponse.status }
      );
    }

    const order = await backendResponse.json();

    return NextResponse.json(
      {
        orderId: order.order_id,
        amount: order.amount,
        currency: order.currency,
        keyId: order.razorpay_key_id,
        customerName: customerName || "Customer",
        customerEmail: customerEmail || "",
        customerPhone: customerPhone || "",
        upiLink: order.upi_link,
        receipt: order.receipt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
