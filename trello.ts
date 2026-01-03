#!/usr/bin/env bun

const API = "https://api.trello.com/1";
const KEY = process.env.TRELLO_KEY;
const TOKEN = process.env.TRELLO_TOKEN;

if (!KEY || !TOKEN) {
  console.error("Error: TRELLO_KEY and TRELLO_TOKEN must be set");
  process.exit(1);
}

export function validateId(id: string, name: string): string {
  if (!/^[a-zA-Z0-9]{8,24}$/.test(id)) {
    throw new Error(`Invalid ${name} format`);
  }
  return id;
}

export function requireArg(
  arg: string | undefined,
  usage: string,
): asserts arg is string {
  if (!arg) {
    console.error(`Usage: trello ${usage}`);
    process.exit(1);
  }
}

export const TIMEOUT_MS = 30000;

async function get<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = new URL(`${API}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        Authorization: `OAuth oauth_consumer_key="${KEY}", oauth_token="${TOKEN}"`,
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${TIMEOUT_MS}ms`);
    }
    throw new Error(
      `Network error: ${error instanceof Error ? error.message : "Unknown"}`,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  try {
    return await res.json();
  } catch (error) {
    throw new Error(
      `JSON parse error: ${error instanceof Error ? error.message : "Unknown"}`,
    );
  }
}

type Board = {
  id: string;
  name: string;
  url: string;
  shortUrl: string;
  closed: boolean;
};

type List = {
  id: string;
  name: string;
  idBoard: string;
  closed: boolean;
  pos: number;
};

type Card = {
  id: string;
  name: string;
  idList: string;
  idBoard: string;
  url: string;
  shortUrl: string;
  desc: string;
  closed: boolean;
  due: string | null;
  dueComplete: boolean;
  pos: number;
};

type SearchResult = {
  cards: Card[];
};

const commands: Record<string, (...args: string[]) => Promise<void>> = {
  async boards() {
    const boards = await get<Board[]>("/members/me/boards");
    for (const board of boards) {
      console.log(`${board.id}\t${board.name}`);
    }
  },

  async lists(boardId: string) {
    requireArg(boardId, "lists <board-id>");
    const id = validateId(boardId, "board-id");
    const lists = await get<List[]>(`/boards/${id}/lists`);
    for (const list of lists) {
      console.log(`${list.id}\t${list.name}`);
    }
  },

  async cards(boardId: string) {
    requireArg(boardId, "cards <board-id>");
    const id = validateId(boardId, "board-id");
    const cards = await get<Card[]>(`/boards/${id}/cards`);
    for (const card of cards) {
      console.log(`${card.id}\t${card.name}`);
    }
  },

  async card(cardId: string) {
    requireArg(cardId, "card <card-id>");
    const id = validateId(cardId, "card-id");
    const card = await get<Card>(`/cards/${id}`);
    console.log(JSON.stringify(card, null, 2));
  },

  async search(query: string) {
    requireArg(query, "search <query>");
    const result = await get<SearchResult>("/search", {
      query,
      modelTypes: "cards",
    });
    if (result.cards.length === 0) {
      console.log("No cards found");
      return;
    }
    for (const card of result.cards) {
      console.log(`${card.id}\t${card.name}`);
    }
  },

  async help() {
    console.log(`Usage: trello <command> [args]

Commands:
  boards              List all boards
  lists <board-id>    List all lists in a board
  cards <board-id>    List all cards in a board
  card <card-id>      Show card details (JSON)
  search <query>      Search cards by keyword
  help                Show this help

Environment:
  TRELLO_KEY          Trello API key
  TRELLO_TOKEN        Trello API token
`);
  },
};

const [cmd = "help", ...args] = process.argv.slice(2);

if (!(cmd in commands)) {
  console.error(`Unknown command: ${cmd}`);
  commands.help();
  process.exit(1);
}

commands[cmd](...args).catch((error) => {
  console.error(
    error instanceof Error ? error.stack || error.message : String(error),
  );
  process.exit(1);
});
