import { GraphQLServer, PubSub } from "graphql-yoga";

const TODOS_CHANNEL = "TODOS_CHANNEL";

const pubsub = new PubSub();

let todos = [
  {
    id: "1",
    text: "Learn GraphQL + Soild",
    done: false,
  },
];

const typeDefs = `
  type Todo {
    id: ID!
    done: Boolean!
    text: String!
  }
  type Query {
    getTodos: [Todo]!
  }
  type Mutation {
    addTodo(text: String!): Todo
    setDone(id: ID!, done: Boolean!): Todo
  }
  type Subscription {
    todos: [Todo]!
  }
`;

const resolvers = {
  Query: {
    getTodos: () => {
      return todos;
    },
  },
  Mutation: {
    addTodo: (
      _: unknown,
      { text }: { text: string },
      { pubsub }: { pubsub: PubSub }
    ) => {
      const newTodo = {
        id: String(todos.length + 1),
        text,
        done: false,
      };
      todos.push(newTodo);
      pubsub.publish(TODOS_CHANNEL, { todos });
      return newTodo;
    },
    setDone: (
      _: unknown,
      { id, done }: { id: string; done: boolean },
      { pubsub }: { pubsub: PubSub }
    ) => {
      const todo = todos.find((todo) => todo.id === id);
      if (!todo) {
        throw new Error("Todo not found");
      }
      todo.done = done;
      pubsub.publish(TODOS_CHANNEL, { todos });
      return todo;
    },
  },
  Subscription: {
    todos: {
      subscribe: () => {
        const iterator = pubsub.asyncIterator(TODOS_CHANNEL);
        pubsub.publish(TODOS_CHANNEL, { todos });
        return iterator;
      },
    },
  },
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: { pubsub },
});
server.start(() => console.log("Server is running on http://localhost:4000"));
