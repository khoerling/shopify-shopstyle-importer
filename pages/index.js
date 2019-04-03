import Link from 'next/link'
import React, { useRef, useState, useEffect } from 'react'
import { ApolloProvider, ApolloClient, createNetworkInterface } from 'react-apollo'
import { Page, Layout, Button, Card, OptionList, ResourceList, Thumbnail, TextStyle, Caption, Subheading, FilterType } from '@shopify/polaris'

import '../static/index.sass'

var dbf = null
const
  key   = 'TEST',
  limit      = 500,
  categories = ['makeup', 'skin-care'],
  Promise    = require('bluebird'),
  App        = props => {
    const
      [products, setProducts] = useState([]),
      [searchValue, setSearchValue] = useState([]),
      fetchProducts = search => {
        Promise.all(categories.map(cat => {
          // fetch products for each category
          return fetch(`https://api.shopstyle.com/api/v2/products?pid=${key}&cat=${cat}&fts=${search}&offset=0&limit=${limit}&format=json`)
            .then(res => res.json())
            .then(res => res.products || [])
        })).then(res => {
          // combine product results
          const products = []
          res.forEach(r => r.forEach(p => products.push(p)))
          // set & save
          setProducts(products)
          set('products', products)
        })
      },
      searchDidChange = search => {
        // update ui for immediate feedback
        setSearchValue(search)
        set('searchValue', search)
        // fetch & save products for each category
        if (dbf) clearTimeout(dbf)
        dbf = setTimeout(_ => fetchProducts(search), 1000)
      }

    useEffect(_ => {
      // runs once, eg. componentDidMount
      setProducts(get('products') || [])
      setSearchValue(get('searchValue') || '')
    }, [])

    return (
      <Page
        title="ShopStyle Import">
        <Card>
          <ResourceList
            resourceName={{singular: 'product', plural: 'products'}}
            items={products}
            filterControl={<ResourceList.FilterControl
              searchValue={searchValue}
              onSearchChange={searchDidChange} />
            }
            renderItem={(item) => {
              const
                {id, name, priceLabel, clickUrl, description, brand, image} = item,
                media = <Thumbnail size="large" source={image.sizes.Large.url} />,
                categories = item.categories.reduce((acc, cur) => acc + ` ${cur.shortName}`, '')
              return (
                <ResourceList.Item
                  id={id}
                  url={clickUrl}
                  media={media}
                  accessibilityLabel={`View details for ${name}`}>
                  <Layout>
                    <Layout.Section>
                      <h3>
                        <TextStyle variation="strong">{name}</TextStyle>
                      </h3>
                      <Subheading>{priceLabel}</Subheading>
                      <Caption>{categories}</Caption>
                      <div dangerouslySetInnerHTML={{ __html: description }} />
                    </Layout.Section>
                    <Layout.Section secondary>
                      <Button outline>Add</Button>
                    </Layout.Section>
                  </Layout>
                </ResourceList.Item>
              )
            }}
        />
        </Card>
      </Page>
    )
  }

// ---------
function get(key) {
  return JSON.parse(localStorage.getItem(key))
}
function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

export default App
