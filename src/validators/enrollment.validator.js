import { z } from "zod";

const updateBatchEndDateSchema = z.object({
  body: z.object({ endDate: z.string().min(8) }),
  params: z.object({ batch: z.string().min(1) }),
  query: z.object({}).optional(),
});

export { updateBatchEndDateSchema };
export default { updateBatchEndDateSchema };
