import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  // create: publicProcedure
  //   .input(z.object({ name: z.string().min(1) }))
  //   .mutation(async ({ ctx, input }) => {
  //     // simulate a slow db call
  //     await new Promise((resolve) => setTimeout(resolve, 1000));

  //     return ctx.db.post.create({
  //       data: {
  //         authorId: input.name,
  //         title: input.name,
  //       },
  //     });
  //   }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.post.findMany();

    // return ctx.db.post.findFirst({
    //   orderBy: { createdAt: "desc" },
    // });
  }),
});
