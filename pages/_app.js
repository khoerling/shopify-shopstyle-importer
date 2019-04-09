import App, {Container} from 'next/app'
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
      {Component, pageProps} = this.props
    return (
      <Container>
        <AppProvider shopOrigin={isClient ? window : ''}>
            <Component {...pageProps} />
        </AppProvider>
      </Container>
    )
  }
}

export default MyApp
