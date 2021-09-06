import type { Component } from "solid-js";
import { createResource, For, createSignal } from "solid-js";
import {
  createClient,
  defaultExchanges,
  subscriptionExchange,
} from "@urql/core";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { pipe, subscribe } from "wonka";

const subscriptionClient = new SubscriptionClient("ws://localhost:4000", {
  reconnect: true,
});

const client = createClient({
  url: "http://localhost:4000",
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription: (operation) =>
        subscriptionClient.request(operation) as any,
    }),
  ],
});

interface ChatMessage {
  id: string;
  from: string;
  text: string;
}

const [messages, setMessages] = createSignal<ChatMessage[]>([]);

const { unsubscribe } = pipe(
  client.subscription(`
  subscription {
    messages {
      id
      from
      text
    }
  }
`),
  subscribe((result) => {
    setMessages(result.data.messages);
  })
);

const App: Component = () => {
  const [text, setText] = createSignal("");
  const [from, setFrom] = createSignal("Jack");

  const onAdd = async () => {
    await client
      .mutation(
        `
    mutation($text: String!, $from: String!) {
      add(text: $text, from: $from) {
        id
      }
    }`,
        {
          text: text(),
          from: from(),
        }
      )
      .toPromise();
    setText("");
  };

  return (
    <div>
      <For each={messages()}>
        {({ from, text }) => (
          <div>
            <span>
              {from}: {text}
            </span>
          </div>
        )}
      </For>
      <div>
        <input
          type="text"
          value={from()}
          oninput={(evt) => setFrom(evt.currentTarget.value)}
        />
        <input
          type="text"
          value={text()}
          oninput={(evt) => setText(evt.currentTarget.value)}
        />
        <button onclick={onAdd}>Add</button>
      </div>
    </div>
  );
};

export default App;
