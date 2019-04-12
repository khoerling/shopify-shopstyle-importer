if (!process.browser) // polyfill
  global.fetch = require('isomorphic-unfetch')

const
  shopifyAuth   = require('@dimensionsoftware/koa-shopify-auth').default,
  verifyRequest = require('@dimensionsoftware/koa-shopify-auth').verifyRequest,
  graphqlProxy  = require('@shopify/koa-shopify-graphql-proxy').default

const Koa = require('koa')
const next = require('next')
const Router = require('koa-router')
const session = require('koa-session')
const cors = require('@koa/cors')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const initApollo = require('./lib/init-apollo')
const gql = require('graphql-tag').default

app
  .prepare()
  .then(() => {
    const server = new Koa()
    const router = new Router()
    server.proxy = true
    server.keys = [ process.env.SERVER_SECRET ]
    server
      .use(cors({
        origin: (ctx) => {
          return '*'
        },
      }))
      .use(session({}, server))
      .use(shopifyAuth({
        // if specified, mounts the routes off of the given path
        // eg. /shopify/auth, /shopify/auth/callback
        // defaults to ''
        prefix: '/shopify',
        // your shopify app api key
        apiKey: process.env.NEXT_STATIC_SHOPIFY_API_KEY,
        // your shopify app secret
        secret: process.env.SHOPIFY_SECRET,
        // scopes to request on the merchants store
        scopes: ['write_orders, write_products'],
        // ask for the token that lasts until uninstallation
        accessMode: 'offline',
        // callback for when auth is completed
        afterAuth(ctx) {
          console.log('--------------- begin afterAuth ---------------')
          // add/install shop
          const
            {shop, accessToken} = ctx.session
          console.log(`Authorized ${shop} with token: ${accessToken}`)
          ctx.redirect(`/?shop=${shop}`)
        },
      })
    )

    router.get('/shopify/uninstall', async ctx => {
      // delete/uninstall shop
      const
        {shop, accessToken} = ctx.session,
        client              = initApollo()
      console.log(`Uninstalled ${shop} with token: ${accessToken}`)
      ctx.redirect('/')
    })

    router.get('/a', async ctx => {
      await app.render(ctx.req, ctx.res, '/b', ctx.query)
      ctx.respond = false
    })

    router.get('/b', async ctx => {
      await app.render(ctx.req, ctx.res, '/a', ctx.query)
      ctx.respond = false
    })

    router.get('*', async ctx => {
      await handle(ctx.req, ctx.res)
      ctx.respond = false
    })

    server.use(async (ctx, next) => {
      ctx.res.statusCode = 200
      await next()
    })

    server.use(router.routes())
    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`)
    })
  })
