import { clerkClient } from "@clerk/nextjs";
import { Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { title } from "process";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

const addUserDataToPosts = async (posts: Post[]) => {
  const userId = posts.map((post) => post.authorId as string);

  const users = (
    await clerkClient.users.getUserList({
      userId: userId,
      limit: 110,
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author) {
      console.error("AUTHOR NOT FOUND", post);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Author for post not found. POST ID: ${post.id}, USER ID: ${post.authorId}`,
      });
    }
    if (!author.username) {
      // user the ExternalUsername
      if (!author.externalUsername) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Author has no GitHub Account: ${author.id}`,
        });
      }
      author.username = author.externalUsername;
    }
    return {
      post,
      author: {
        ...author,
        username: author.username ?? "(username not found)",
      },
    };
  });
};

// Create a new ratelimiter, that allows 3 requests per 1 minute
// const ratelimit = new Ratelimit({
//   redis: Redis.fromEnv(),
//   limiter: Ratelimit.slidingWindow(3, "1 m"),
//   analytics: true,
// });

export const postRouter = createTRPCRouter({
  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.post
        .findMany({
          where: {
            authorId: input.userId,
          },
          take: 100,
          orderBy: [{ createdAt: "desc" }],
        })
        .then(addUserDataToPosts),
    ),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    // const users = (
    //   await clerkClient.users.getUserList({
    //     userId: posts.map((post) => post.authorId as string),
    //     limit: 100,
    //   })
    // ).map(filterUserForClient);

    // return posts.map((post) => {
    //   const author = users.find((user) => user.id === post.authorId);

    //   if (!author) {
    //     console.error("AUTHOR NOT FOUND", post);

    //     throw new TRPCError({
    //       code: "INTERNAL_SERVER_ERROR",
    //       message: `Author for post not found. POST ID: ${post.id}, USER ID: ${post.authorId}`,
    //     });
    //   }

    //   return {
    //     post,
    //     // author: users.find((user) => user.id === post.authorId),
    //     author: { ...author, username: author.username },
    //   };
    // });

    // return ctx.db.post.findFirst({
    //   orderBy: { createdAt: "desc" },
    // });

    return addUserDataToPosts(posts);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: parseInt(input.id) },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      return (await addUserDataToPosts([post]))[0];
    }),

  create: publicProcedure
    .input(
      z.object({
        // content: z.string().emoji("Only emojis are allowed").min(1).max(280),
        title: z.string().min(4).max(280),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("createdauthorId", ctx);

      const authorId = ctx.userId;

      // const { success } = await ratelimit.limit(authorId);
      // if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      if (authorId) {
        const post = await ctx.db.post.create({
          data: {
            authorId,
            title: input.title,
          },
        });

        console.log("createdpost", post);

        return post;
      }
    }),
});
