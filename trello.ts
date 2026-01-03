#!/usr/bin/env bun

const API = "https://api.trello.com/1";
const KEY = process.env.TRELLO_KEY;
const TOKEN = process.env.TRELLO_TOKEN;

if (!KEY || !TOKEN) {
  console.error("Error: TRELLO_KEY and TRELLO_TOKEN must be set");
  process.exit(1);
}

const auth = `key=${KEY}&token=${TOKEN}`;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}?${auth}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

type Board = { id: string; name: string; url: string };
type List = { id: string; name: string; idBoard: string };
type Card = { id: string; name: string; idList: string; url: string; desc: string };

const commands: Record<string, (...args: string[]) => Promise<void>> = {
  async boards() {
    const boards = await get<Board[]>("/members/me/boards");
    for (const b of boards) {
      console.log(`${b.id}\t${b.name}`);
    }
  },

  async lists(boardId: string) {
    if (!boardId) {
      console.error("Usage: trello lists <board-id>");
      process.exit(1);
    }
    const lists = await get<List[]>(`/boards/${boardId}/lists`);
    for (const l of lists) {
      console.log(`${l.id}\t${l.name}`);
    }
  },

  async cards(boardId: string) {
    if (!boardId) {
      console.error("Usage: trello cards <board-id>");
      process.exit(1);
    }
    const cards = await get<Card[]>(`/boards/${boardId}/cards`);
    for (const c of cards) {
      console.log(`${c.id}\t${c.name}`);
    }
  },

  async card(cardId: string) {
    if (!cardId) {
      console.error("Usage: trello card <card-id>");
      process.exit(1);
    }
    const card = await get<Card>(`/cards/${cardId}`);
    console.log(JSON.stringify(card, null, 2));
  },

  async help() {
    console.log(`Usage: trello <command> [args]

Commands:
  boards              List all boards
  lists <board-id>    List all lists in a board
  cards <board-id>    List all cards in a board
  card <card-id>      Show card details (JSON)
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

commands[cmd](...args).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
