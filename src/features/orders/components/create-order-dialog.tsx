import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import {
  Calendar,
  Check,
  MapPin,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  User,
  UserPlus,
  Utensils,
  X,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCustomerAddresses, useCustomers } from '@/features/customers/hooks/use-customers'
import { useActiveDeliverySlots, useCreateAdminOrder, useFoodItemsForOrder } from '@/features/orders/hooks/use-orders'
import type { FoodItemForOrder, ResolvedAdminOptionGroup } from '@/features/orders/services/orders-service'
import { fetchThaliOptionGroupsForAdminOrder } from '@/features/orders/services/orders-service'
import { supabase } from '@/lib/supabase'
import { CURRENCY_SYMBOL } from '@/constants'
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/database.types'
import toast from 'react-hot-toast'

export type SelectedCartItem = {
  cartId: string
  food_item_id: string
  item_name: string
  item_kind: 'single' | 'thali'
  item_image_url?: string | null
  unit_price: number
  quantity: number
  selectedOptions: {
    group_name: string
    option_name: string
    price_delta: number
  }[]
  customization_total: number
  line_total: number
  special_instructions?: string
}

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedCustomerId?: string
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  preselectedCustomerId,
}: CreateOrderDialogProps) {
  const { data: customers, refetch: refetchCustomers } = useCustomers()
  const { data: foodItems } = useFoodItemsForOrder()
  const { data: deliverySlots } = useActiveDeliverySlots()
  const createOrder = useCreateAdminOrder()

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const { data: customerAddresses } = useCustomerAddresses(selectedCustomerId)

  const [customerSearch, setCustomerSearch] = useState('')
  const [addressMode, setAddressMode] = useState<'saved' | 'new'>('saved')
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')

  // Quick Inline Customer Registration State
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [isCreatingCust, setIsCreatingCust] = useState(false)

  // Delivery Address fields
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [landmark, setLandmark] = useState('')
  const [city, setCity] = useState('Surat')
  const [state, setState] = useState('Gujarat')
  const [pincode, setPincode] = useState('395007')
  const [saveNewAddress, setSaveNewAddress] = useState(true)

  // Delivery & Slot fields
  const [deliveryDate, setDeliveryDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [deliverySlotId, setDeliverySlotId] = useState<string>('')

  // Item Search & Filter
  const [itemSearch, setItemSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Cart Items State
  const [cartItems, setCartItems] = useState<SelectedCartItem[]>([])

  // Financial & Payment State
  const [deliveryCharge, setDeliveryCharge] = useState<number>(30)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [taxAmount, setTaxAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')
  const [paymentReference, setPaymentReference] = useState('')
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('accepted')
  const [specialInstructions, setSpecialInstructions] = useState('')

  // Address optional toggle
  const [skipAddress, setSkipAddress] = useState(false)

  // Item Customization Modal / Sub-state
  const [customizingItem, setCustomizingItem] = useState<FoodItemForOrder | null>(null)
  const [resolvedThaliGroups, setResolvedThaliGroups] = useState<ResolvedAdminOptionGroup[]>([])
  const [isLoadingThaliGroups, setIsLoadingThaliGroups] = useState(false)
  const [tempOptions, setTempOptions] = useState<Record<string, { label: string; price_delta: number }>>({})
  const [tempAddons, setTempAddons] = useState<Record<string, boolean>>({})
  const [tempNotes, setTempNotes] = useState('')

  // Pre-fill customer if prop provided or defaults
  useEffect(() => {
    if (preselectedCustomerId) {
      setSelectedCustomerId(preselectedCustomerId)
    }
  }, [preselectedCustomerId, open])

  const selectedCustomer = useMemo(() => {
    return customers?.find((c) => c.id === selectedCustomerId)
  }, [customers, selectedCustomerId])

  // Sync address fields when customer or saved address changes
  useEffect(() => {
    if (selectedCustomer) {
      setContactName(selectedCustomer.full_name || '')
      setContactPhone(selectedCustomer.phone || '')
    }
  }, [selectedCustomer])

  useEffect(() => {
    if (customerAddresses && customerAddresses.length > 0 && addressMode === 'saved') {
      const defaultAddr = customerAddresses.find((a) => a.is_default) || customerAddresses[0]
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id)
        setContactName(defaultAddr.contact_name)
        setContactPhone(defaultAddr.contact_phone)
        setAddressLine1(defaultAddr.address_line1)
        setAddressLine2(defaultAddr.address_line2 || '')
        setLandmark(defaultAddr.landmark || '')
        setCity(defaultAddr.city)
        setState(defaultAddr.state)
        setPincode(defaultAddr.pincode)
      }
    }
  }, [customerAddresses, addressMode])

  // Filtered customer list for combobox/search
  const filteredCustomers = useMemo(() => {
    if (!customers) return []
    const q = customerSearch.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    )
  }, [customers, customerSearch])

  // Handle Inline Quick Customer Creation
  const handleQuickCreateCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      toast.error('Customer name and phone number are required')
      return
    }
    setIsCreatingCust(true)
    try {
      // Insert profile into database
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          full_name: newCustName.trim(),
          phone: newCustPhone.trim(),
          email: newCustEmail.trim() || null,
          role: 'customer',
          is_active: true,
          is_subscription_eligible: true,
          total_orders: 0,
          total_spent: 0,
          marketing_opt_in: true,
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`Registered new customer: ${data.full_name}`)
      await refetchCustomers()
      setSelectedCustomerId(data.id)
      setContactName(data.full_name || '')
      setContactPhone(data.phone || '')
      setIsQuickCustomerOpen(false)
      setNewCustName('')
      setNewCustPhone('')
      setNewCustEmail('')
    } catch (err: any) {
      toast.error(`Error creating customer: ${err.message}`)
    } finally {
      setIsCreatingCust(false)
    }
  }

  // Food Item categories for filter tab
  const categories = useMemo(() => {
    if (!foodItems) return []
    const map = new Map<string, string>()
    foodItems.forEach((item) => {
      if (item.categories) {
        map.set(item.categories.id, item.categories.name)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [foodItems])

  // Filtered Food Items
  const filteredFoodItems = useMemo(() => {
    if (!foodItems) return []
    let result = foodItems
    if (selectedCategory !== 'all') {
      result = result.filter((i) => i.categories?.id === selectedCategory)
    }
    const q = itemSearch.trim().toLowerCase()
    if (q) {
      result = result.filter((i) => i.name.toLowerCase().includes(q))
    }
    return result
  }, [foodItems, selectedCategory, itemSearch])

  // Handle opening customization for an item
  const openCustomizer = async (item: FoodItemForOrder) => {
    setCustomizingItem(item)
    setResolvedThaliGroups([])
    setTempOptions({})
    setTempAddons({})
    setTempNotes('')

    // Default item customizations (add-ons)
    const initialAddons: Record<string, boolean> = {}
    if (item.item_customizations) {
      item.item_customizations.forEach((cust) => {
        if (cust.is_default) {
          initialAddons[cust.id] = true
        }
      })
    }
    setTempAddons(initialAddons)

    // For thali items: dynamically fetch option groups (daily menu driven)
    if (item.kind === 'thali' || (item.thali_option_groups && item.thali_option_groups.length > 0)) {
      setIsLoadingThaliGroups(true)
      try {
        const dynamicGroups = await fetchThaliOptionGroupsForAdminOrder(item.id, deliveryDate)
        setResolvedThaliGroups(dynamicGroups)

        // Auto-select defaults
        const initialOpts: Record<string, { label: string; price_delta: number }> = {}
        dynamicGroups.forEach((grp) => {
          const defaultOpt = grp.options.find((o) => o.is_default) || grp.options[0]
          if (defaultOpt) {
            initialOpts[grp.id] = { label: defaultOpt.label, price_delta: defaultOpt.price_delta }
          }
        })
        setTempOptions(initialOpts)
      } catch (err) {
        console.error('Failed to load thali options:', err)
        toast.error('Could not load thali options. Try again.')
      } finally {
        setIsLoadingThaliGroups(false)
      }
    }
  }

  // Add customized item to cart
  const confirmAddToCart = () => {
    if (!customizingItem) return

    const selectedOptionsList: { group_name: string; option_name: string; price_delta: number }[] = []
    let custTotal = 0

    // Validate required thali option groups (dynamic resolved groups)
    for (const grp of resolvedThaliGroups) {
      if (grp.is_required && !tempOptions[grp.id]) {
        toast.error(`Please make a selection for '${grp.name}'`)
        return
      }
    }

    resolvedThaliGroups.forEach((grp) => {
      const sel = tempOptions[grp.id]
      if (sel) {
        selectedOptionsList.push({
          group_name: grp.name,
          option_name: sel.label,
          price_delta: sel.price_delta,
        })
        custTotal += sel.price_delta
      }
    })

    // Add selected standalone add-ons
    const sabjiGroup = resolvedThaliGroups.find((g) => {
      const n = g.name.toLowerCase()
      return (
        n.includes('sabji') ||
        n.includes('shabji') ||
        n.includes('sabzi') ||
        n.includes('subji') ||
        n.includes('curry') ||
        (g as any).target_category_type === 'sabji'
      )
    })
    const availSabjis = sabjiGroup ? sabjiGroup.options.filter((o) => o.is_available) : []
    let processedSabjiDynamic = false

    if (customizingItem.item_customizations && customizingItem.item_customizations.length > 0) {
      customizingItem.item_customizations.forEach((cust) => {
        const isSabjiCustomization =
          cust.name.toLowerCase().includes('sabji') ||
          cust.name.toLowerCase().includes('shabji') ||
          cust.name.toLowerCase().includes('sabzi') ||
          cust.name.toLowerCase().includes('shaak')

        if (isSabjiCustomization && availSabjis.length > 0) {
          processedSabjiDynamic = true
          availSabjis.forEach((sabji) => {
            const key = `${cust.id}__sabji__${sabji.id}`
            if (tempAddons[key]) {
              selectedOptionsList.push({
                group_name: 'Add-on',
                option_name: `Extra ${sabji.label}`,
                price_delta: Number(cust.price_delta || 40),
              })
              custTotal += Number(cust.price_delta || 40)
            }
          })
        } else {
          if (tempAddons[cust.id]) {
            selectedOptionsList.push({
              group_name: 'Add-on',
              option_name: cust.name,
              price_delta: Number(cust.price_delta || 0),
            })
            custTotal += Number(cust.price_delta || 0)
          }
        }
      })
    }

    if (!processedSabjiDynamic && availSabjis.length > 0) {
      availSabjis.forEach((sabji) => {
        const key = `dynamic_extra_sabji__${sabji.id}`
        if (tempAddons[key]) {
          selectedOptionsList.push({
            group_name: 'Add-on',
            option_name: `Extra ${sabji.label}`,
            price_delta: 40,
          })
          custTotal += 40
        }
      })
    }

    const unitPrice = Number(customizingItem.compare_price ?? customizingItem.price)
    const lineTotal = (unitPrice + custTotal) * 1

    const newCartItem: SelectedCartItem = {
      cartId: `${customizingItem.id}-${Date.now()}`,
      food_item_id: customizingItem.id,
      item_name: customizingItem.name,
      item_kind: customizingItem.kind,
      item_image_url: customizingItem.image_url,
      unit_price: unitPrice,
      quantity: 1,
      selectedOptions: selectedOptionsList,
      customization_total: custTotal,
      line_total: lineTotal,
      special_instructions: tempNotes.trim() || undefined,
    }

    setCartItems((prev) => [...prev, newCartItem])
    setCustomizingItem(null)
    setResolvedThaliGroups([])
  }

  // Directly add item if no options exist
  const addSimpleItemToCart = (item: FoodItemForOrder) => {
    const unitPrice = Number(item.compare_price ?? item.price)
    const existingIndex = cartItems.findIndex((c) => c.food_item_id === item.id && c.selectedOptions.length === 0)

    if (existingIndex > -1) {
      // Increment quantity
      setCartItems((prev) => {
        const copy = [...prev]
        const existing = copy[existingIndex]
        const newQty = existing.quantity + 1
        copy[existingIndex] = {
          ...existing,
          quantity: newQty,
          line_total: (existing.unit_price + existing.customization_total) * newQty,
        }
        return copy
      })
    } else {
      const newCartItem: SelectedCartItem = {
        cartId: `${item.id}-${Date.now()}`,
        food_item_id: item.id,
        item_name: item.name,
        item_kind: item.kind,
        item_image_url: item.image_url,
        unit_price: unitPrice,
        quantity: 1,
        selectedOptions: [],
        customization_total: 0,
        line_total: unitPrice,
      }
      setCartItems((prev) => [...prev, newCartItem])
    }
  }

  // Update item quantity in cart
  const updateCartQty = (cartId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta
            if (newQty <= 0) return null
            return {
              ...item,
              quantity: newQty,
              line_total: (item.unit_price + item.customization_total) * newQty,
            }
          }
          return item
        })
        .filter(Boolean) as SelectedCartItem[],
    )
  }

  const removeCartItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartId !== cartId))
  }

  // Computations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.line_total, 0)
  }, [cartItems])

  const totalAmount = useMemo(() => {
    const total = subtotal + Number(deliveryCharge || 0) + Number(taxAmount || 0) - Number(discountAmount || 0)
    return Math.max(0, total)
  }, [subtotal, deliveryCharge, taxAmount, discountAmount])

  // Submit Order
  const handleSubmitOrder = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer')
      return
    }
    if (cartItems.length === 0) {
      toast.error('Please add at least one item to the cart')
      return
    }

    const selectedSlotObj = deliverySlots?.find((s) => s.id === deliverySlotId)

    await createOrder.mutateAsync({
      userId: selectedCustomerId,
      contactName: contactName || undefined,
      contactPhone: contactPhone || undefined,
      addressId: addressMode === 'saved' ? (selectedAddressId || undefined) : undefined,
      addressLine1: addressLine1 || undefined,
      addressLine2: addressLine2 || undefined,
      landmark: landmark || undefined,
      city: city || undefined,
      state: state || undefined,
      pincode: pincode || undefined,
      saveNewAddress: addressMode === 'new' && saveNewAddress,
      deliveryDate,
      deliverySlotId: deliverySlotId || undefined,
      deliverySlotLabel: selectedSlotObj ? `${selectedSlotObj.label} (${selectedSlotObj.start_time.slice(0, 5)} - ${selectedSlotObj.end_time.slice(0, 5)})` : undefined,
      paymentMethod: paymentMethod || undefined,
      paymentStatus: paymentStatus || undefined,
      paymentReference: paymentReference || undefined,
      orderStatus,
      subtotal,
      deliveryCharge: Number(deliveryCharge || 0),
      discountAmount: Number(discountAmount || 0),
      taxAmount: Number(taxAmount || 0),
      totalAmount,
      specialInstructions: specialInstructions || undefined,
      items: cartItems.map((item) => ({
        food_item_id: item.food_item_id,
        item_name: item.item_name,
        item_kind: item.item_kind,
        item_image_url: item.item_image_url,
        unit_price: item.unit_price,
        quantity: item.quantity,
        customizations: item.selectedOptions,
        customization_total: item.customization_total,
        line_total: item.line_total,
        special_instructions: item.special_instructions,
      })),
    })

    // Reset and close
    setCartItems([])
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl lg:max-w-5xl p-0 overflow-hidden flex flex-col bg-background border-l shadow-2xl">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold flex items-center gap-2">
                Point of Sale: Create Customer Order
              </SheetTitle>
              <SheetDescription className="text-xs">
                Select customer, set delivery logistics, configure Thalis & items, and collect payment.
              </SheetDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </div>

        {/* MAIN POS BODY (2-COLUMN RESPONSIVE LAYOUT) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT PANEL: WIZARD STEPS & MENU (7 cols) */}
          <div className="lg:col-span-7 overflow-y-auto p-6 space-y-6 border-r">
            {/* STEP 1: CUSTOMER SELECTION */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <User className="size-4 text-primary" />
                    Step 1: Select Customer
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="gap-1 text-xs text-primary border-primary/30 hover:bg-primary/5"
                    onClick={() => setIsQuickCustomerOpen(true)}
                  >
                    <UserPlus className="size-3.5" />
                    + New Customer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Search Customer *</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="w-full h-10 text-xs">
                      <SelectValue placeholder="Search by customer name, phone number, or email…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <div className="p-2 sticky top-0 bg-popover z-10 border-b">
                        <Input
                          placeholder="Type to filter customers…"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      {filteredCustomers.map((cust) => (
                        <SelectItem key={cust.id} value={cust.id} className="py-2">
                          <div className="flex flex-col text-left">
                            <span className="font-semibold text-sm">{cust.full_name || 'Unnamed Customer'}</span>
                            <span className="text-muted-foreground text-xs">
                              📞 {cust.phone || 'No phone'} | ✉️ {cust.email || 'No email'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomer && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">{selectedCustomer.full_name}</span>
                      <p className="text-muted-foreground mt-0.5">{selectedCustomer.phone} • {selectedCustomer.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Verified Profile</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* STEP 2: DELIVERY ADDRESS */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <MapPin className="size-4 text-primary" />
                    Step 2: Delivery Address
                    <span className="text-muted-foreground font-normal text-[11px]">(Optional)</span>
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant={skipAddress ? 'default' : 'outline'}
                      size="xs"
                      className={skipAddress ? 'text-[11px] bg-muted text-muted-foreground hover:bg-muted/80' : 'text-[11px]'}
                      onClick={() => {
                        setSkipAddress((v) => !v)
                        if (!skipAddress) {
                          setContactName('')
                          setContactPhone('')
                          setAddressLine1('')
                          setAddressLine2('')
                          setLandmark('')
                          setCity('')
                          setState('')
                          setPincode('')
                          setSelectedAddressId('')
                        }
                      }}
                    >
                      {skipAddress ? 'Add Address' : 'Skip for Now'}
                    </Button>
                    {!skipAddress && customerAddresses && customerAddresses.length > 0 && (
                      <>
                        <Button
                          type="button"
                          variant={addressMode === 'saved' ? 'default' : 'outline'}
                          size="xs"
                          onClick={() => setAddressMode('saved')}
                        >
                          Saved ({customerAddresses.length})
                        </Button>
                        <Button
                          type="button"
                          variant={addressMode === 'new' ? 'default' : 'outline'}
                          size="xs"
                          onClick={() => {
                            setAddressMode('new')
                            setSelectedAddressId('')
                          }}
                        >
                          + New
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              {skipAddress ? (
                <div className="px-6 pb-4">
                  <p className="text-xs text-muted-foreground italic">
                    Address skipped — order will be saved without a delivery address.
                  </p>
                </div>
              ) : (
              <CardContent className="space-y-4">
                {addressMode === 'saved' && customerAddresses && customerAddresses.length > 0 ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Select Saved Address</Label>
                    <Select
                      value={selectedAddressId}
                      onValueChange={(val) => {
                        setSelectedAddressId(val)
                        const addr = customerAddresses.find((a) => a.id === val)
                        if (addr) {
                          setContactName(addr.contact_name)
                          setContactPhone(addr.contact_phone)
                          setAddressLine1(addr.address_line1)
                          setAddressLine2(addr.address_line2 || '')
                          setLandmark(addr.landmark || '')
                          setCity(addr.city)
                          setState(addr.state)
                          setPincode(addr.pincode)
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Choose saved address" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerAddresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            <span className="font-semibold capitalize">{addr.label}: </span>
                            {addr.address_line1}, {addr.city} ({addr.pincode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {/* Form inputs with spacious layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Recipient Name</Label>
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Recipient Phone</Label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-medium">Address Line 1</Label>
                    <Input
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="House / Flat / Building No. / Street"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Address Line 2</Label>
                    <Input
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Area / Locality"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Landmark</Label>
                    <Input
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Nearby Landmark"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">City</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Pincode</Label>
                    <Input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="Pincode"
                      className="h-9 text-xs"
                    />
                  </div>
                  {addressMode === 'new' && (
                    <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="chk-save-addr"
                        checked={saveNewAddress}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                        className="size-4 accent-primary rounded cursor-pointer"
                      />
                      <label htmlFor="chk-save-addr" className="text-xs font-normal cursor-pointer text-foreground">
                        Save this address to customer's saved profile
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
              )}
            </Card>

            {/* STEP 3: SCHEDULE & SLOT */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Calendar className="size-4 text-primary" />
                  Step 3: Delivery Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Delivery Date *</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Delivery Slot</Label>
                  <Select value={deliverySlotId} onValueChange={setDeliverySlotId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select delivery slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {deliverySlots?.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.label} ({slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* STEP 4: FOOD MENU SELECTION */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Utensils className="size-4 text-primary" />
                    Step 4: Select Food Items
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {filteredFoodItems.length} Available items
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search & Category Tabs */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search menu items…"
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {filteredFoodItems.map((item) => {
                    const price = item.compare_price ?? item.price
                    const hasOptions =
                      (item.thali_option_groups && item.thali_option_groups.length > 0) ||
                      (item.item_customizations && item.item_customizations.length > 0)

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{item.name}</span>
                            <Badge
                              variant="outline"
                              className={
                                item.food_type === 'veg' || item.food_type === 'jain'
                                  ? 'border-emerald-500 text-emerald-600 bg-emerald-50/40 text-[10px] py-0 px-1.5'
                                  : 'border-amber-500 text-amber-600 bg-amber-50/40 text-[10px] py-0 px-1.5'
                              }
                            >
                              {item.food_type}
                            </Badge>
                            {item.kind === 'thali' && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                Thali
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground font-medium">
                            {CURRENCY_SYMBOL}{price}
                            {item.compare_price ? (
                              <span className="line-through ml-1.5 text-muted-foreground/70 text-[11px]">
                                {CURRENCY_SYMBOL}{item.price}
                              </span>
                            ) : null}
                          </p>
                        </div>

                        {hasOptions ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs"
                            onClick={() => openCustomizer(item)}
                          >
                            <SlidersHorizontal className="size-3.5" />
                            Customize & Add
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1.5 text-xs"
                            onClick={() => addSimpleItemToCart(item)}
                          >
                            <Plus className="size-3.5" />
                            Add
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT PANEL: STICKY CART & FINANCIAL BREAKDOWN (5 cols) */}
          <div className="lg:col-span-5 bg-muted/20 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="font-semibold text-base flex items-center gap-2 text-foreground">
                  <Receipt className="size-4 text-primary" />
                  Cart Items ({cartItems.length})
                </span>
                {cartItems.length > 0 && (
                  <Button variant="ghost" size="xs" className="text-xs text-destructive hover:bg-destructive/10" onClick={() => setCartItems([])}>
                    Clear All
                  </Button>
                )}
              </div>

              {/* Cart List */}
              {cartItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs space-y-2 border border-dashed rounded-xl p-6 bg-card">
                  <Utensils className="size-8 mx-auto text-muted-foreground/40" />
                  <p className="font-medium text-foreground">No items added to cart</p>
                  <p>Choose items from Step 4 menu on the left.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.cartId} className="bg-card p-3 rounded-xl border text-xs space-y-2 shadow-2xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{item.item_name}</p>
                          <p className="text-muted-foreground text-[11px]">
                            Base: {CURRENCY_SYMBOL}{item.unit_price}
                          </p>
                        </div>
                        <p className="font-bold text-sm text-foreground">
                          {CURRENCY_SYMBOL}{item.line_total}
                        </p>
                      </div>

                      {/* Customization Details */}
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="bg-muted/50 p-2 rounded-lg text-[11px] space-y-1 border">
                          {item.selectedOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center justify-between text-muted-foreground">
                              <span>
                                {opt.group_name}: <strong className="text-foreground">{opt.option_name}</strong>
                              </span>
                              {opt.price_delta > 0 && (
                                <span className="text-primary font-semibold">+{CURRENCY_SYMBOL}{opt.price_delta}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t">
                        <div className="flex items-center gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            className="size-6 p-0 font-bold"
                            onClick={() => updateCartQty(item.cartId, -1)}
                          >
                            -
                          </Button>
                          <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                          <Button
                            size="xs"
                            variant="outline"
                            className="size-6 p-0 font-bold"
                            onClick={() => updateCartQty(item.cartId, 1)}
                          >
                            +
                          </Button>
                        </div>

                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-6 text-destructive hover:bg-destructive/10 p-1"
                          onClick={() => removeCartItem(item.cartId)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FINANCIAL BREAKDOWN */}
              <div className="bg-card p-4 rounded-xl border space-y-2.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">{CURRENCY_SYMBOL}{subtotal}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Delivery Fee ({CURRENCY_SYMBOL})</span>
                  <Input
                    type="number"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                    className="w-24 h-8 text-xs text-right font-medium"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Admin Discount ({CURRENCY_SYMBOL})</span>
                  <Input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    className="w-24 h-8 text-xs text-right font-medium"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Taxes ({CURRENCY_SYMBOL})</span>
                  <Input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    className="w-24 h-8 text-xs text-right font-medium"
                  />
                </div>
                <div className="flex items-center justify-between border-t pt-2 text-base font-bold text-foreground">
                  <span>Total Amount</span>
                  <span className="text-primary">{CURRENCY_SYMBOL}{totalAmount}</span>
                </div>
              </div>

              {/* PAYMENT & ORDER CONTROLS */}
              <div className="bg-card p-4 rounded-xl border space-y-3 text-xs shadow-2xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Payment Method <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v === '__none__' ? '' : v as PaymentMethod)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Not specified" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Not specified</SelectItem>
                        <SelectItem value="cash">Cash on Delivery</SelectItem>
                        <SelectItem value="upi">UPI / Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Payment Status <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v === '__none__' ? '' : v as PaymentStatus)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Not specified" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Not specified</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Txn Reference / Payment ID</Label>
                  <Input
                    placeholder="e.g. UPI Ref / Cash Receipt #"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Initial Order Status</Label>
                  <Select value={orderStatus} onValueChange={(v) => setOrderStatus(v as OrderStatus)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accepted">Accepted (Confirmed)</SelectItem>
                      <SelectItem value="pending">Pending Confirmation</SelectItem>
                      <SelectItem value="ready">Ready for Dispatch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Special Kitchen Instructions</Label>
                  <Textarea
                    placeholder="e.g., Deliver before 1:30 PM, extra spicy…"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="h-16 text-xs resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ACTION SUBMIT BUTTON */}
            <div className="pt-4 border-t space-y-2">
              <Button
                onClick={handleSubmitOrder}
                disabled={createOrder.isPending || cartItems.length === 0 || !selectedCustomerId}
                className="w-full h-11 text-sm font-semibold gap-2 shadow-md"
              >
                {createOrder.isPending ? (
                  'Placing Order…'
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Place Order ({CURRENCY_SYMBOL}{totalAmount})
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full text-xs" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>

      {/* SUB-DIALOG 1: QUICK INLINE CUSTOMER REGISTRATION */}
      <Dialog open={isQuickCustomerOpen} onOpenChange={setIsQuickCustomerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserPlus className="size-4 text-primary" />
              Quick Register New Customer
            </DialogTitle>
            <DialogDescription className="text-xs">
              Register a new customer account on the spot to place their order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Full Name *</Label>
              <Input
                placeholder="e.g. Ramesh Patel"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Phone Number *</Label>
              <Input
                placeholder="e.g. 9876543210"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Email Address (Optional)</Label>
              <Input
                placeholder="e.g. ramesh@gmail.com"
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsQuickCustomerOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleQuickCreateCustomer} disabled={isCreatingCust}>
              {isCreatingCust ? 'Creating…' : 'Save & Select Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUB-DIALOG 2: THALI OPTIONS & ADD-ONS CUSTOMIZER */}
      {customizingItem && (
        <Dialog open={!!customizingItem} onOpenChange={() => setCustomizingItem(null)}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <SlidersHorizontal className="size-4 text-primary" />
                Customize {customizingItem.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select mandatory options and optional extras for this item.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 max-h-96 overflow-y-auto pr-1">
              {/* Thali Option Groups – dynamically loaded from daily menu */}
              {isLoadingThaliGroups ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground text-xs">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading today's thali choices…</span>
                </div>
              ) : resolvedThaliGroups.length === 0 && !isLoadingThaliGroups ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No thali option groups configured for this item.
                </p>
              ) : (
                resolvedThaliGroups
                  .filter((g) => {
                    const n = g.name.toLowerCase()
                    return !n.includes('add-on') && !n.includes('addon')
                  })
                  .map((grp) => (
                    <div key={grp.id} className="space-y-2 border-b pb-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground">{grp.name}</span>
                        {grp.is_required && <Badge variant="secondary" className="text-[10px]">Required</Badge>}
                      </div>
                      {grp.options.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          No items available for this group on the selected date.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {grp.options.map((opt) => {
                            const isSelected = tempOptions[grp.id]?.label === opt.label
                            const priceDelta = opt.price_delta
                            return (
                              <div
                                key={opt.id}
                                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                                  !opt.is_available
                                    ? 'opacity-50 cursor-not-allowed bg-muted/40'
                                    : isSelected
                                    ? 'border-primary bg-primary/10 font-semibold'
                                    : 'hover:bg-accent/40 bg-card'
                                }`}
                                onClick={() => {
                                  if (!opt.is_available) return
                                  setTempOptions((prev) => ({
                                    ...prev,
                                    [grp.id]: { label: opt.label, price_delta: priceDelta },
                                  }))
                                }}
                              >
                                <span className="flex items-center gap-2">
                                  <span className={`size-4 rounded-full border flex items-center justify-center ${
                                    isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/40'
                                  }`}>
                                    {isSelected && <Check className="size-3 stroke-[3]" />}
                                  </span>
                                  {opt.label}
                                  {!opt.is_available && (
                                    <span className="text-destructive text-[10px] font-normal">(unavailable)</span>
                                  )}
                                </span>
                                {priceDelta > 0 && (
                                  <span className="text-primary font-bold">+{CURRENCY_SYMBOL}{priceDelta}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))
              )}

              {/* Item Add-ons / Customizations */}
              {(() => {
                const sabjiGroup = resolvedThaliGroups.find((g) => {
                  const n = g.name.toLowerCase()
                  return (
                    n.includes('sabji') ||
                    n.includes('shabji') ||
                    n.includes('sabzi') ||
                    n.includes('subji') ||
                    n.includes('curry') ||
                    (g as any).target_category_type === 'sabji'
                  )
                })
                const availSabjis = sabjiGroup ? sabjiGroup.options.filter((o) => o.is_available) : []
                const customizations = customizingItem.item_customizations || []

                let hasSabjiInCust = false
                const addonElements: React.ReactNode[] = []

                const addOnGroups = resolvedThaliGroups.filter((g) => {
                  const n = g.name.toLowerCase()
                  return n.includes('add-on') || n.includes('addon')
                })

                addOnGroups.forEach((grp) => {
                  grp.options.forEach((opt) => {
                    if (!opt.is_available) return
                    const key = opt.id
                    const isChecked = !!tempAddons[key]
                    const priceDelta = Number(opt.price_delta || 0)
                    addonElements.push(
                      <div
                        key={key}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                          isChecked ? 'border-primary bg-primary/10 font-semibold' : 'hover:bg-accent/40 bg-card'
                        }`}
                        onClick={() =>
                          setTempAddons((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="size-4 rounded border-primary accent-primary"
                          />
                          {opt.label}
                        </span>
                        {priceDelta > 0 && (
                          <span className="text-primary font-bold">+{CURRENCY_SYMBOL}{priceDelta}</span>
                        )}
                      </div>
                    )
                  })
                })

                customizations.forEach((cust) => {
                  const isSabji =
                    cust.name.toLowerCase().includes('sabji') ||
                    cust.name.toLowerCase().includes('shabji') ||
                    cust.name.toLowerCase().includes('sabzi') ||
                    cust.name.toLowerCase().includes('shaak')

                  if (isSabji) {
                    hasSabjiInCust = true
                    if (availSabjis.length > 0) {
                      availSabjis.forEach((sabji) => {
                        const key = `${cust.id}__sabji__${sabji.id}`
                        const isChecked = !!tempAddons[key]
                        const priceDelta = Number(cust.price_delta || 40)
                        const displayName = `Extra ${sabji.label}`
                        addonElements.push(
                          <div
                            key={key}
                            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                              isChecked ? 'border-primary bg-primary/10 font-semibold' : 'hover:bg-accent/40 bg-card'
                            }`}
                            onClick={() =>
                              setTempAddons((prev) => ({
                                ...prev,
                                [key]: !prev[key],
                              }))
                            }
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                className="size-4 rounded border-primary accent-primary"
                              />
                              {displayName}
                            </span>
                            {priceDelta > 0 && (
                              <span className="text-primary font-bold">+{CURRENCY_SYMBOL}{priceDelta}</span>
                            )}
                          </div>
                        )
                      })
                    }
                  } else {
                    const isChecked = !!tempAddons[cust.id]
                    const priceDelta = Number(cust.price_delta || 0)
                    addonElements.push(
                      <div
                        key={cust.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                          isChecked ? 'border-primary bg-primary/10 font-semibold' : 'hover:bg-accent/40 bg-card'
                        }`}
                        onClick={() =>
                          setTempAddons((prev) => ({
                            ...prev,
                            [cust.id]: !prev[cust.id],
                          }))
                        }
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="size-4 rounded border-primary accent-primary"
                          />
                          {cust.name}
                        </span>
                        {priceDelta > 0 && (
                          <span className="text-primary font-bold">+{CURRENCY_SYMBOL}{priceDelta}</span>
                        )}
                      </div>
                    )
                  }
                })

                if (!hasSabjiInCust && availSabjis.length > 0) {
                  availSabjis.forEach((sabji) => {
                    const key = `dynamic_extra_sabji__${sabji.id}`
                    const isChecked = !!tempAddons[key]
                    const priceDelta = 40
                    const displayName = `Extra ${sabji.label}`
                    addonElements.push(
                      <div
                        key={key}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                          isChecked ? 'border-primary bg-primary/10 font-semibold' : 'hover:bg-accent/40 bg-card'
                        }`}
                        onClick={() =>
                          setTempAddons((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="size-4 rounded border-primary accent-primary"
                          />
                          {displayName}
                        </span>
                        <span className="text-primary font-bold">+{CURRENCY_SYMBOL}{priceDelta}</span>
                      </div>
                    )
                  })
                }

                if (addonElements.length === 0) return null

                return (
                  <div className="space-y-2 border-b pb-3">
                    <span className="text-xs font-semibold text-foreground">Add-ons & Extras</span>
                    <div className="space-y-1.5">{addonElements}</div>
                  </div>
                )
              })()}

              {/* Special Note per item */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Item Preference / Instructions</Label>
                <Input
                  placeholder="e.g., Less oil, no garlic…"
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setCustomizingItem(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={confirmAddToCart}>
                Add to Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Sheet>
  )
}
