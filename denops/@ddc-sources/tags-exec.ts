import {
  BaseSource,
  Item
} from "https://deno.land/x/ddc_vim@v2.3.1/types.ts#^";
import { Denops, fn } from "https://deno.land/x/ddc_vim@v2.3.1/deps.ts#^";
import { exists } from "https://deno.land/std@0.153.0/fs/mod.ts#^";

type Params = {
  maxSize: number;
  cmd: string[];
  args: string[];
  appendTagFiles: boolean;
};

const splitTags = (tagOpt: string): string[] => {
  if (tagOpt) {
    return tagOpt.split(",");
  } else {
    return [];
  }
};

const prepareTagsList = async (
  denops: Denops,
  pwd: string,
  bufnr: number
): Promise<string[]> => {
  const tagString = (await fn.getbufvar(denops, bufnr, "&tags")) as string;
  const existingTags = [];
  const tags = splitTags(tagString);

  for (const tag of tags) {
    const cleaned = tag.replace("./", "");
    //INFO prepend with current working directory and cleanup
    const preparedTag =
      cleaned.match("/home") == null ? pwd + "/" + cleaned : cleaned;
    const existing = await exists(preparedTag);

    if (existing !== null) {
      existingTags.push(preparedTag);
    }
  }
  //INFO uniqueness
  return [...new Set(existingTags)];
};

export class Source extends BaseSource<Params> {
  async gather(args: {
    denops: Denops;
    completeStr: string;
    sourceParams: Params;
  }): Promise<Item[]> {
    const max = Math.min(Math.max(1, args.sourceParams.maxSize), 2000);
    const cwd = await fn.getcwd(args.denops);
    const bufnr = await fn.bufnr(args.denops) as number;
    const tagFiles = await prepareTagsList(args.denops, cwd, bufnr);
    if (tagFiles.length < 1) {
      return [];
    }

    const input = args.completeStr.replaceAll(/([\\\[\]^$.*])/g, "\\$1");
    const cmd = args.sourceParams.cmd.map((el) =>
      el.replace("{PLACEHOLDER}", input)
    );

    if (args.sourceParams.appendTagFiles) {
      tagFiles.forEach((file) => cmd.push(file));
    }
    if (args.sourceParams.maxSize > 0) {
      cmd.push(`| head -n ${max}`);
    }

    const p = Deno.run({
      cmd,
      stdout: "piped",
      stderr: "piped",
      stdin: "null"
    });
    const [_state, stdout, _stderr] = await Promise.all([
      p.status(),
      p.output(),
      p.stderrOutput()
    ]);
    p.close();

    const lines = new TextDecoder().decode(stdout).split(/\r?\n/);
    // const error = new TextDecoder().decode(stderr).split(/\r?\n/);
    const candidates = lines
      .filter((line) => line.length != 0)
      .map((word: string) => {
        const w = word.split("\t");
        let wordWithoutPath;
        if (w[0].includes(":")) {
          wordWithoutPath = w[0].split(":")[1];
        } else {
          wordWithoutPath = w[0];
        }
        return {
          word: wordWithoutPath,
          menu: w[1],
          kind: w[3].split(":")[1]
        };
      });

    return candidates;
  }

  params(): Params {
    return {
      maxSize: 100,
      cmd: ["ug", "^{PLACEHOLDER}[_A-Za-z0-9-]*\t", "--color=never"],
      appendTagFiles: true,
      args: []
    };
  }
}
