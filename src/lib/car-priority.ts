import cars from "../../knowledge/cars.json";

// Порядок показа машин — в knowledge/cars.json, раздел "priority" (1 — первыми, 2 — после них)
export const CAR_PRIORITY: Record<number, number> = cars.priority;
