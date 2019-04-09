import App, {Container} from 'next/app'
import withApolloClient from '../lib/with-apollo-client'
import { ApolloProvider } from 'react-apollo'
import { Page, AppProvider } from '@shopify/polaris'
import queryString from 'query-string'
import '@shopify/polaris/styles.css'

global.isClient = typeof(window) !== 'undefined'

class MyApp extends App {
  render () {
    const
      apiKey     = process.env.NEXT_STATIC_SHOPIFY_API_KEY,
      query      = global.isClient ? queryString.parse(window.location.search) : '',
      shopOrigin = query.shop || 'http://live-tinted.myshopify.com',
      {Component, pageProps, apolloClient} = this.props
    return (
      <Container>
        <AppProvider shopOrigin={isClient ? window : ''}>
          <ApolloProvider client={apolloClient}>
            <Component {...pageProps} />
          </ApolloProvider>
        </AppProvider>
      </Container>
    )
  }
}

export default withApolloClient(MyApp)
