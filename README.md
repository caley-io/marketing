<p align="center">
  <a href="https://github.com/caley-io/caley">
    <h1 align="center">The repo is being switched to Rails and is now located here</h1>
  </a>
</p>

<p align="center">
  <a href="https://www.caley.io">
    <h1 align="center">Caley.io</h1>
  </a>
  <p align="center">
    The open-source email client for the modern era.
    <br />
    <a href="https://caley.io">Website</a>
    ·
    <a href="https://github.com/Magnet-wtf/caley.io/issues">Issues</a>
    ·
    <a href="https://github.com/orgs/Magnet-wtf/projects/1/views/1?layout=board">Kanban</a>
    ·
    <a href="https://discord.gg/3Makqk7Q">Discord</a>
  </p>
</p>

## About

Caley.io reimagines your inbox with a fusion of AI brilliance and unmatched efficiency. Think smarter analytics, streamlined conversations, and effortless newsletter management all in one sleek package. More than an email client,
it's your unfair advantage.

The repository is based on [Inbox Zero](https://github.com/elie222/inbox-zero/tree/main) Which as inspired the newsletter and stats features

## Key Features

- **AI-Powered Efficiency**: Imagine an inbox that not only understands you but also acts on your behalf..
- **Customized Email Responses**: Tailored AI-generated email responses in your unique style.
- **Newsletter Management**: Simplify subscriptions with easy management and one-click unsubscribe.
- **Inbox Analytics**: Gain actionable insights from advanced email analytics.
- **Keyboard Command Center**: Control your inbox efficiently with intuitive keyboard shortcuts.
- **Smart Calendar Integration**: Effortlessly synchronize and manage your calendar from your inbox.

## Built with

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Tinybird](https://tinybird.co/)
- [Upstash](https://upstash.com/)
- [Turbo](https://turbo.build/)

## Roadmap

Feel free to create Issues, feature requests or anything you have in mind

## Getting Started for Developers

### Requirements

- [Node.js](https://nodejs.org/en/) >= 18.0.0
- [pnpm](https://pnpm.io/) >= 8.6.12
- [Docker desktop](https://www.docker.com/products/docker-desktop/)

The external services that are required are:

- [OpenAI](https://platform.openai.com/api-keys)
- [Google OAuth](https://console.cloud.google.com/apis/credentials)
- [Google PubSub](https://console.cloud.google.com/cloudpubsub/topic/list) - see set up instructions below
- [Upstash Redis](https://upstash.com/)
- [Tinybird](https://www.tinybird.co/)

We use Postgres for the database.

You can run Postgres & Redis locally using `docker-compose`

```bash
docker-compose up -d # -d will run the services in the background
```

Create your own `.env` file:

```bash
cp apps/web/.env.example apps/web/.env
cd apps/web
pnpm install
```

Set the environment variables in the newly created `.env`. You can see a list of required variables in: `apps/web/env.mjs`.

The required environment variables:

- `NEXTAUTH_SECRET` -- can be any random string (try using `openssl rand -hex 32` for a quick secure random string)
- `GOOGLE_CLIENT_ID` -- Google OAuth client ID. More info [here](https://next-auth.js.org/providers/google)
- `GOOGLE_CLIENT_SECRET` -- Google OAuth client secret. More info [here](https://next-auth.js.org/providers/google)
- `TINYBIRD_TOKEN` -- Admin token for your Tinybird workspace (be sure to create an instance in the GCP `us-east4` region. This can also be changed via your `.env` if you prefer a different region).
- `OPENAI_API_KEY` -- Standard OpenAI API key.

To run the migrations:

```bash
pnpm prisma migrate dev
```

Now run:

```bash
pnpm run dev
```

Or from the project root:

```bash
turbo dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
To upgrade yourself to admin visit: [http://localhost:3000/admin](http://localhost:3000/admin).

### Setting up Tinybird

Follow the instructions [here](./packages/tinybird/README.md) to setup the `pipes` and `datasources`.

### Set up push notifications via Google PubSub to handle emails in real time

Follow instructions [here](https://developers.google.com/gmail/api/guides/push).

1. [Create a topic](https://developers.google.com/gmail/api/guides/push#create_a_topic)
2. [Create a subscription](https://developers.google.com/gmail/api/guides/push#create_a_subscription)
3. [Grant publish rights on your topic](https://developers.google.com/gmail/api/guides/push#grant_publish_rights_on_your_topic)

Set env var `GOOGLE_PUBSUB_TOPIC_NAME`.
When creating the subscription select Push and the url should look something like: `https://www.getinboxzero.com/api/google/webhook` or `https://abc.ngrok-free.app/api/google/webhook` where the domain is your domain.

To run in development ngrok can be helpful:

```sh
ngrok http 3000
```

And then update the webhook endpoint in the [Google PubSub subscriptions dashboard](https://console.cloud.google.com/cloudpubsub/subscription/list).

To start watching emails visit: `/api/google/watch/all`.
