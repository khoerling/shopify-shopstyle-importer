import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Page, Layout, Button, Card, OptionList, ResourceList, Thumbnail, TextStyle, Caption, Subheading, FilterType, FooterHelp } from '@shopify/polaris'

import '../static/index.sass'

var
  dbf       = null, // debounce fn
  isEditing = false  // until polaris improves event-handling
const
  key        = process.env.SHOPSTYLE_API_KEY || 'TEST',
  limit      = 500,
  categories = ['makeup', 'skin-care'],
  moment     = require('moment'),
  Promise    = require('bluebird'),
  App        = props => {
    const
      [added, setAdded]       = useState(get('addedProducts') || {}),
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
      addProduct = id => {
        // TODO add product to shopify store
        isEditing = true
        added[id] = {addedAt: new Date()}
        setAdded(set('addedProducts', added))
        setProducts(get('products')) // FIXME trigger update
        console.log('add', id)
        setTimeout(_ => isEditing = false, 100)
      },
      removeProduct = id => {
        // TODO remove product from shopify store
        isEditing = true
        delete added[id]
        setAdded(set('addedProducts', added))
        setProducts(get('products')) // FIXME trigger update
        console.log('remove', id)
        setTimeout(_ => isEditing = false, 100)
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
      <Page>
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
                media =
                  <div className="media">
                    <Thumbnail size="large" source={image.sizes.Large.url} />
                    <Subheading>{priceLabel}</Subheading>
                  </div>,
                categories = item.categories.reduce((acc, cur) => acc + ` ${cur.shortName}`, '')
              return (
                <ResourceList.Item
                  id={id}
                  onClick={e => { if (!isEditing) window.open(clickUrl) }}
                  media={media}
                  accessibilityLabel={`Details for ${name}`}>
                  <Layout>
                    <Layout.Section>
                      <h3>
                        <TextStyle variation="strong">{name}</TextStyle>
                      </h3>
                      <Caption>by {item.brand ? item.brand.name : ''} in {categories}</Caption>
                      <div dangerouslySetInnerHTML={{ __html: description }} />
                    </Layout.Section>
                    <div className="actions">
                      {added[id]
                        ? <div>
                            <Button outline onClick={_ => removeProduct(id)}>Remove</Button>
                            <small
                              title={`${moment(added[id].addedAt).format('MMMM Do YYYY, h:mm:ss a')}`}>
                                Added {`${moment(added[id].addedAt).fromNow()}`}
                            </small>
                          </div>
                        : <Button onClick={_ => addProduct(id)}>Add</Button>}
                    </div>
                  </Layout>
                </ResourceList.Item>
              )
            }}
        />
        </Card>
        <FooterHelp>
          <a href="mailto:info@manufactur.co">Looking for help?  Email us!</a>
        </FooterHelp>
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
