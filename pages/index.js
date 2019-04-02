import Link from 'next/link'
import React, { useRef, useState, useEffect } from 'react'
import { ApolloProvider, ApolloClient, createNetworkInterface } from 'react-apollo'
import { Page, Layout, Button, Card, OptionList, ResourceList, Thumbnail, TextStyle, Caption, Subheading, FilterType } from '@shopify/polaris'

import '../static/index.sass'

const
  key   = 'TEST',
  limit = 25,
  App   = props => {
    const
      catSelKey = 'shopstyle-categories-selected',
      [products, setProducts] = useState([]),
      [categoryChoices, setCategoryChoices] = useState([]),
      [categoriesSelected, setCategoriesSelected] = useState([]),
      [searchValue, setSearchValue] = useState([]),
      setProductsFromSelectedCategories = _ => {
        const
          products = [],
          categoriesSelected = get(catSelKey) || []
        categoriesSelected.forEach(c => {
          get(c).forEach(p => products.push(p))
        })
        setProducts(products)
      },
      fetchCategoriesSelected = categories => {
        // update ui for immediate feedback
        setCategoriesSelected(categories)
        set(catSelKey, categories)
        categories.forEach(cat => {
          // fetch & save products for each category
          if (!get(cat))
            fetch(`https://api.shopstyle.com/api/v2/products?pid=${key}&cat=${cat}&offset=0&limit=${limit}&format=json`)
              .then(res => res.json())
              .then(res => {
                set(cat, res.products)
                setProductsFromSelectedCategories()
              })
        })
      }

    useEffect(_ => {
      // runs once, eg. componentDidMount
      // situate categories & products
      const
        catKey     = 'shopstyle-categories',
        categories = get(catKey)
      if (!categories) {
        // fetch inital state, no selection/products
        fetch(`https://api.shopstyle.com/api/v2/categories?pid=${key}&format=json`)
          .then(res => res.json())
          .then(res => {
            const categories = res.categories
              .map(c => {return {label: c.name, value: c.id}})
            set(catKey, categories)
            setCategoryChoices(categories)
          })
      } else {
        // update ui with saved state, restores selection
        setCategoryChoices(categories)
        setCategoriesSelected(get(catSelKey) || [])
        setProductsFromSelectedCategories()
      }
    }, [])

    return (
      <Page
        title="ShopStyle Import"
        primaryAction={{ url: '/shops', content: 'Refresh' }}>
        <Card>
          <OptionList
            title="Select Categories"
            options={categoryChoices}
            onChange={fetchCategoriesSelected}
            selected={categoriesSelected || []}
            allowMultiple
            />
        </Card>
        <Card>
          <ResourceList
            resourceName={{singular: 'product', plural: 'products'}}
            items={products.filter(p => p.description.indexOf(searchValue) !== -1)}
            filterControl={<ResourceList.FilterControl
              searchValue={searchValue}
              onSearchChange={setSearchValue} />
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
  return localStorage.setItem(key, JSON.stringify(value))
}

export default App
