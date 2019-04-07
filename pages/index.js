import Link from 'next/link'
import React, { useRef, useState, useEffect } from 'react'
import { ApolloProvider, ApolloClient, createNetworkInterface } from 'react-apollo'
import { Page, Layout, Button, Card, OptionList, ResourceList, Thumbnail, TextStyle, Caption, Subheading, FilterType } from '@shopify/polaris'

import '../static/index.sass'

var dbf = null
const
  key        = process.env.SHOPSTYLE_API_KEY || 'TEST',
  limit      = 500,
  categories = ['makeup', 'skin-care'],
  Promise    = require('bluebird'),
  App        = props => {
    const
      [search, setSearch]     = useState(get('search') || ''),
      [brands, setBrands]     = useState(get('brands') || []),
      [filters, setFilters]   = useState(get('filters') || []),
      [products, setProducts] = useState(get('products' || [])),
      fetchInitial = _ => {
        const brands = get('brands')
        if (!brands.length) {
          // fetch inital brands
          fetch(`https://api.shopstyle.com/api/v2/brands?pid=${key}&format=json`)
            .then(res => res.json())
            .then(res => {
              const
              alpha = (a, b) => {
                const
                x = a.label.toLowerCase(),
                y = b.label.toLowerCase()
                if (x < y) return -1
                if (x > y) return 1
                return 0
              },
              brands = res.brands
                .map(c => {return {label: c.name, value: c.id}})
              setBrands(set('brands', brands.sort(alpha)))
            })
        }
      },
      fetchProducts = search => {
        const
          filters = get('filters'),
          fls = filters.length
            ? filters.map(f => `&fl=b${f.value}`).join('')
            : ''
        Promise.all(categories.map(cat => {
          // fetch products for each category
          return fetch(`https://api.shopstyle.com/api/v2/products?pid=${key}${fls}&cat=${cat}&fts=${search}&offset=0&limit=${limit}&format=json`)
            .then(res => res.json())
            .then(res => res.products || [])
        })).then(res => {
          // combine product results
          const products = []
          res.forEach(r => r.forEach(p => products.push(p)))
          // set & save
          setProducts(set('products', products))
        })
      },
      filtersDidChange = filters => {
        // set filters & search products
        setFilters(set('filters', filters))
        fetchProducts(search)
      },
      searchDidChange = search => {
        // update ui for immediate feedback
        setSearch(set('search', search))
        // debounce fetch & save products for each category
        if (dbf) clearTimeout(dbf)
        dbf = setTimeout(_ => fetchProducts(search), 1000)
      },
      availableFilters = [
        {
          key: 'brand',
          label: 'Brand',
          operatorText:'is',
          type: FilterType.Select,
          options: brands
        },
      ]

    useEffect(_ => {
      // runs once, eg. componentDidMount
      toggleClass('loaded')
      fetchInitial()
    }, [])

    return (
      <Page
        title="ShopStyle Import">
        <Card>
          <ResourceList
            resourceName={{singular: 'product', plural: 'products'}}
            items={products}
            filterControl={<ResourceList.FilterControl
              additionalAction={{
                content: 'Clear',
                onAction: _ => {
                  // reset all local storage
                  setProducts(set('products', []))
                  setSearch(set('search', ''))
                  setFilters(set('filters', []))
                  setBrands(set('brands', []))
                  // fetch
                  fetchInitial()
                }
              }}
              filters={availableFilters}
              appliedFilters={filters}
              searchValue={search}
              onFiltersChange={filtersDidChange}
              onSearchChange={searchDidChange} />
            }
            renderItem={(item) => {
              const
                {id, name, priceLabel, clickUrl, description, image} = item,
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
                      <Caption>{item.brand ? item.brand.name : ''}</Caption>
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
  if (typeof(window) === 'undefined') return false
  if (!window.localStorage) return false
  return JSON.parse(localStorage.getItem(key))
}
function set(key, value) {
  if (typeof(window) === 'undefined') return false
  if (!window.localStorage) return false
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

function toggleClass(className, add=true) {
  const body = document.body
  if (add) {
    if (body.className.indexOf(className) === -1)
      body.className += ` ${className}`
  } else {
    if (body.className.indexOf(className) > -1)
      body.className = body.className.replace(` ${className}`, '')
  }
}

export default App
