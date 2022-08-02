import {
  BaseSource,
  Candidate,
  Context,
} from "https://deno.land/x/ddc_vim@v2.3.0/types.ts#^";
import {
  Denops,
  fn,
} from "https://deno.land/x/ddc_vim@v2.3.0/deps.ts#^";
import { existsSync } from "https://deno.land/std@0.142.0/fs/mod.ts#^";

type Params = {
  maxSize: number;
  cmd: string;
  args: string[];
};

export class Source extends BaseSource<Params> {
  private tags: string[] = [];

  private getTags(tagOpt: string): string[] {
    if (tagOpt) {
      return tagOpt.split(",");
    } else {
      return [];
    }
  }

  private async prepareTagsList(denops: Denops, cwd: string): string[] {
    this.tags = this.getTags(
      await fn.getbufvar(denops, 1, "&tags") as string,
    );

    //INFO prepend with current working directory and cleanup
    this.tags = this.tags.map(el => {
      const cleaned = el.replace("./", "");
      if (cleaned.match("home") != null) {
        return el;
      } else {
        return cwd + "/" + cleaned;
      }
    }).filter(el => existsSync(el));

    //INFO uniqueness
    return [...new Set(this.tags)];
  }

  async gather(args: {
    denops: Denops,
    completeStr: string,
    sourceParams: Params,
  }): Promise<Candidate[]> {
    const cwd = await fn.getcwd(args.denops);
    const max = Math.min(Math.max(1, args.sourceParams.maxSize), 2000);
    const tagFiles = await this.prepareTagsList(args.denops, cwd);
    const input = args.completeStr.replaceAll(/([\\\[\]^$.*])/g, '\\$1');
    const cmd = args.sourceParams.cmd.map(el => el.replace("{PLACEHOLDER}", input));

    if (args.sourceParams.appendTagFiles) {
      tagFiles.forEach(file => cmd.push(file));
    }
    if (args.sourceParams.maxSize > 0) {
      cmd.push(`| head -n ${max}`);
    }
    // console.table(cmd);

    const p = Deno.run({
      cmd: cmd,
      stdout: "piped",
      stderr: "piped",
      stdin: "null",
    });
    const [state, stdout, stderr] = await Promise.all([
      p.status(),
      p.output(),
      p.stderrOutput()
    ]);
    p.close();
    // console.log(`state: ${JSON.stringify(state, null, 2)}`);
    // console.log(stdout.length);
    // console.log(stderr.length);

    const lines = new TextDecoder().decode(stdout).split(/\r?\n/);
    const error = new TextDecoder().decode(stderr).split(/\r?\n/);
    // debugger;
    // console.log("cmd");
    // console.log(cmd);
    // console.log("lines");
    // console.table(lines);
    // console.log("error");
    // console.table(error);

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
        // console.log({ w });
        return {
          word: wordWithoutPath,
          menu: w[1],
          kind: w[3].split(":")[1]
        };
      });
    // console.table(candidates);

    return candidates;
  }

  params(): Params {
    return {
      maxSize: 100,
      // // cmd: ['rg', '^{PLACEHOLDER}[_A-Za-z0-9-]*\t', '--color', 'never', '-IN'],
      cmd: ['ug', '^{PLACEHOLDER}[_A-Za-z0-9-]*\t', '--color=never'],
      appendTagFiles: true
      // cmd: [
      //   'psql', 'postgres://superuser:superuserpass@127.0.0.1:8000/tags', '-c',
      //   "\copy (select word, menu, 'empty' as empty, kind from tags where word LIKE '{PLACEHOLDER}%' order by word asc) to stdout"
      // ],
      // appendTagFiles: false,
    };
  }
}
