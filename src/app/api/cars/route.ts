import { NextRequest, NextResponse } from "next/server";
import { fetchCarData, fetchFreeCars } from "@/lib/rentprog";
import { mapRentProgCar } from "@/lib/cars";
import { CAR_PRIORITY } from "@/lib/car-priority";

const CONCURRENCY_LIMIT = 2;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const days = Number(searchParams.get("days"));

  if (!startDate || !endDate || !days) {
    return NextResponse.json(
      { error: "start_date, end_date and days are required" },
      { status: 400 }
    );
  }

  try {
    const freeCars = await fetchFreeCars(startDate, endDate);

    const cars = await mapWithConcurrency(freeCars, CONCURRENCY_LIMIT, async (free) => {
      const data = await fetchCarData(free.id, startDate, endDate, days);
      return mapRentProgCar(free, data, days);
    });

    const sorted = cars.sort((a, b) => {
      const groupA = CAR_PRIORITY[Number(a.id)] ?? 2;
      const groupB = CAR_PRIORITY[Number(b.id)] ?? 2;
      // Сначала группа 1, потом группа 2
      // Внутри каждой группы — случайный порядок
      if (groupA !== groupB) return groupA - groupB;
      return Math.random() - 0.5;
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error("RentProg /api/cars failed:", error);
    return NextResponse.json({ error: "Failed to load cars" }, { status: 502 });
  }
}
