import type { RouterOutputs } from "~/utils/api";

import Image from "next/image";
import Link from "next/link";

import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["post"]["getAll"][number];

export const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      {author && (
        <Image
          src={author.profileImageUrl}
          className="h-14 w-14 rounded-full"
          alt={`@${author.username}'s profile picture`}
          width={56}
          height={56}
        />
      )}

      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          {author && (
            <Link href={`/@${author.username}`}>
              <span>{`@${author.username} `}</span>
            </Link>
          )}

          <Link href={`/post/${post.id}`}>
            <span className="font-thin">
              {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                ` · ${dayjs(post.createdAt).fromNow()}`
              }
            </span>
          </Link>
        </div>
        <span className="text-2xl">{post.title}</span>
      </div>
    </div>
  );
};
