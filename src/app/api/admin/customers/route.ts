import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all orders with paid status
        const orders = await prisma.order.findMany({
            where: {
                status: 'paid',
                customerEmail: {
                    not: null
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Aggregate by email
        const customerMap = new Map();

        orders.forEach(order => {
            const email = order.customerEmail!;
            if (!customerMap.has(email)) {
                customerMap.set(email, {
                    email,
                    totalSpend: 0,
                    orders: 0,
                    lastOrderDate: order.createdAt,
                    currency: order.currency
                });
            }

            const customer = customerMap.get(email);
            customer.totalSpend += order.amount;
            customer.orders += 1;
            // Keep most recent date
            if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
                customer.lastOrderDate = order.createdAt;
            }
        });

        const customers = Array.from(customerMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);

        return NextResponse.json(customers);
    } catch (error) {
        console.error('Failed to fetch customers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
