import type { Product } from '@/lib/types'
import { MOCK_PRODUCTS } from '@/lib/constants'

/**
 * Mock Product Service
 * Replace with real API calls when backend is ready
 */

export async function getProducts(): Promise<Product[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // MOCK: Return mock products
  // In production, replace with actual backend API call:
  // const response = await fetch('/api/products')
  // const data = await response.json()
  // return data.products

  return MOCK_PRODUCTS
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  // MOCK: Find product by slug
  // In production, replace with:
  // const response = await fetch(`/api/products/${slug}`)
  // return response.json()

  return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null
}

export async function getProductById(id: string): Promise<Product | null> {
  const product = MOCK_PRODUCTS.find((p) => p.id === id)
  return product ?? null
}

export async function getRelatedProducts(
  productId: string,
  limit: number = 4
): Promise<Product[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const product = MOCK_PRODUCTS.find((p) => p.id === productId)
  if (!product) return []

  // MOCK: Get products in same category
  const related = MOCK_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== productId
  ).slice(0, limit)

  return related
}

export async function searchProducts(query: string): Promise<Product[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  const lowerQuery = query.toLowerCase()
  return MOCK_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  )
}
