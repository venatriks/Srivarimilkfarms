import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback
} from 'react';

import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AppContext = createContext(null);

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const DEFAULT_DELIVERY_SLOT = '5:30 AM - 6:30 AM';

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const formatDate = value => {
  if (!value) return '';

  try {
    return String(value).split('T')[0];
  } catch {
    return '';
  }
};

const mapProduct = p => ({
  id: p.id,
  name: p.name || '',
  category: p.category || '',
  price: Number(p.price || 0),
  unit: p.unit || '',
  rating: Number(p.rating || 5),
  reviewsCount: Number(p.reviews_count || 0),

  image:
    p.image &&
      (
        p.image.startsWith('http') ||
        p.image.startsWith('/') ||
        p.image.startsWith('data:')
      )
      ? p.image
      : `${import.meta.env.BASE_URL}${p.image || ''}`,

  badge: p.badge || '',
  description: p.description || '',
  inStock: p.in_stock !== false,
  stockCount: Number(p.stock_count || 0),
  subscriptionAvailable: p.subscription_available !== false,
  labParameters: p.lab_parameters || {},
  nutritionalInfo: p.nutritional_info || {}
});

const mapSubscription = ({
  subscription,
  product,
  customer,
  currentUser
}) => {
  const isCurrentUser =
    subscription.user_id === currentUser?.id;

  return {
    id: subscription.id,

    userId: subscription.user_id,

    customerName:
      customer?.name ||
      (isCurrentUser ? currentUser?.name : '') ||
      'Customer',

    customerEmail:
      customer?.email ||
      (isCurrentUser ? currentUser?.email : '') ||
      '',

    customerPhone:
      customer?.phone ||
      (isCurrentUser ? currentUser?.phone : '') ||
      '',

    customerAddress:
      customer?.address ||
      (isCurrentUser ? currentUser?.address : '') ||
      '',

    productId: subscription.product_id,

    productName:
      product?.name ||
      'Milk Product',

    unit:
      product?.unit ||
      'Liter',

    quantity:
      Number(subscription.quantity || 0),

    /*
     * Database stores "daily".
     * UI gets a friendly display value as well.
     */
    frequency:
      subscription.frequency || 'daily',

    frequencyLabel:
      subscription.frequency === 'daily'
        ? 'Daily Morning'
        : subscription.frequency || 'Daily Morning',

    deliverySlot:
      subscription.delivery_slot ||
      DEFAULT_DELIVERY_SLOT,

    status:
      subscription.status ||
      'Active',

    startDate:
      subscription.start_date,

    pricePerDay:
      Number(subscription.price_per_day || 0),

    bottlesExchanged:
      Number(subscription.bottles_exchanged || 0),

    createdAt:
      subscription.created_at
  };
};

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();

  /*
   * ------------------------------------------------------------
   * APPLICATION STATE
   * ------------------------------------------------------------
   */

  const [products, setProducts] = useState([]);

  const [supabaseActive, setSupabaseActive] =
    useState(false);

  const [dbUsers, setDbUsers] = useState([]);

  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [authReady, setAuthReady] =
    useState(false);

  const idleTimerRef = useRef(null);

  const [cart, setCart] = useState(() => {
    try {
      const saved =
        localStorage.getItem('srivari_cart');

      return saved
        ? JSON.parse(saved)
        : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] =
    useState(false);

  const [checkoutOpen, setCheckoutOpen] =
    useState(false);

  const [selectedLabProduct, setSelectedLabProduct] =
    useState(null);

  /*
   * IMPORTANT:
   * This is the SAME subscriptions state that the
   * existing Admin Dashboard should use for its
   * Daily Milk Subscriptions / 5 AM Roster.
   */
  const [subscriptions, setSubscriptions] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [distributionList, setDistributionList] =
    useState([]);

  const [contactQueries, setContactQueries] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  const [oneTimeOrders, setOneTimeOrders] =
    useState([]);

  const [dbLogs, setDbLogs] =
    useState([]);

  const [toast, setToast] =
    useState(null);

  /*
   * ------------------------------------------------------------
   * TOAST
   * ------------------------------------------------------------
   */

  const showToast = useCallback(
    (message, type = 'success') => {
      setToast({
        message,
        type
      });

      window.setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    []
  );

  /*
   * ------------------------------------------------------------
   * AUTHENTICATED USER
   * ------------------------------------------------------------
   */

  const loadAuthenticatedProfile = useCallback(
    async authUser => {
      if (!authUser) {
        setUser(null);
        setAuthLoading(false);
        return null;
      }

      try {
        let profile = null;

        /*
         * First lookup by Auth UUID.
         */
        const byId =
          await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        if (byId.error) {
          console.error(
            'Unable to load profile by ID:',
            byId.error
          );

          setUser(null);
          setAuthLoading(false);

          return null;
        }

        profile = byId.data;

        /*
         * Fallback lookup by email.
         */
        if (!profile && authUser.email) {
          const byEmail =
            await supabase
              .from('profiles')
              .select('*')
              .eq(
                'email',
                authUser.email.toLowerCase()
              )
              .maybeSingle();

          if (byEmail.error) {
            console.error(
              'Unable to load profile by email:',
              byEmail.error
            );

            setUser(null);
            setAuthLoading(false);

            return null;
          }

          profile = byEmail.data;
        }

        if (
          !profile ||
          ['Deleted', 'Inactive'].includes(
            profile.status
          )
        ) {
          await supabase.auth.signOut();

          setUser(null);
          setAuthLoading(false);

          return null;
        }

        const userRole =
          profile.role ||
          authUser.user_metadata?.role ||
          'customer';

        const loggedInUser = {
          id:
            profile.id ||
            authUser.id,

          name:
            profile.name ||
            authUser.user_metadata?.name ||
            authUser.email,

          email:
            profile.email ||
            authUser.email,

          phone:
            profile.phone ||
            authUser.user_metadata?.phone ||
            '',

          address:
            profile.address ||
            authUser.user_metadata?.address ||
            '',

          role: userRole,

          walletBalance:
            Number(
              profile.wallet_balance ??
              (userRole === 'admin'
                ? 50000
                : 1000)
            ),

          status:
            profile.status ||
            'Active'
        };

        setUser(loggedInUser);
        setAuthLoading(false);

        return loggedInUser;
      } catch (error) {
        console.error(
          'Auth profile restoration error:',
          error
        );

        setUser(null);
        setAuthLoading(false);

        return null;
      }
    },
    []
  );

  /*
   * ------------------------------------------------------------
   * SUPABASE SESSION RESTORE
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSupabaseActive(false);
      setUser(null);
      setAuthLoading(false);
      setAuthReady(true);

      return undefined;
    }

    setSupabaseActive(true);

    let mounted = true;

    const restoreSession = async () => {
      try {
        const {
          data,
          error
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            'Unable to restore Supabase session:',
            error
          );

          if (mounted) {
            setUser(null);
            setAuthLoading(false);
            setAuthReady(true);
          }

          return;
        }

        if (!mounted) return;

        await loadAuthenticatedProfile(
          data?.session?.user || null
        );

        if (mounted) {
          setAuthReady(true);
        }
      } catch (error) {
        console.error(
          'Supabase session restoration failed:',
          error
        );

        if (mounted) {
          setUser(null);
          setAuthLoading(false);
          setAuthReady(true);
        }
      }
    };

    restoreSession();

    const {
      data: authListener
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          window.setTimeout(async () => {
            if (!mounted) return;

            await loadAuthenticatedProfile(
              session?.user || null
            );

            if (mounted) {
              setAuthReady(true);
            }
          }, 0);
        }
      );

    return () => {
      mounted = false;

      authListener?.subscription?.unsubscribe();
    };
  }, [loadAuthenticatedProfile]);

  /*
   * ------------------------------------------------------------
   * AUDIT LOG
   * ------------------------------------------------------------
   */

  const logAction = useCallback(
    async (action, description) => {
      if (!isSupabaseConfigured()) {
        return false;
      }

      try {
        const {
          data: authData
        } =
          await supabase.auth.getUser();

        const authUser =
          authData?.user;

        if (!authUser) {
          return false;
        }

        const {
          data,
          error
        } =
          await supabase
            .from('audit_logs')
            .insert({
              actor_id: authUser.id,
              action,
              description,
              timestamp:
                new Date().toISOString()
            })
            .select('*')
            .single();

        if (error) {
          console.error(
            'Supabase audit log error:',
            error
          );

          return false;
        }

        if (data) {
          setDbLogs(prev => [
            {
              id: data.id,
              action: data.action,
              description:
                data.description,
              timestamp:
                data.timestamp
                  ? new Date(
                    data.timestamp
                  ).toLocaleString()
                  : ''
            },
            ...prev
          ].slice(0, 50));
        }

        return true;
      } catch (error) {
        console.error(
          'Audit logging exception:',
          error
        );

        return false;
      }
    },
    []
  );

  /*
   * ------------------------------------------------------------
   * PRODUCTS
   * ------------------------------------------------------------
   */

  const fetchProducts =
    useCallback(async () => {
      const {
        data,
        error
      } =
        await supabase
          .from('products')
          .select('*')
          .order(
            'created_at',
            {
              ascending: false
            }
          );

      if (error) {
        console.error(
          'Error fetching products:',
          error
        );

        return;
      }

      setProducts(
        (data || []).map(mapProduct)
      );
    }, []);

  /*
   * ------------------------------------------------------------
   * PROFILES
   * ------------------------------------------------------------
   */

  const fetchProfiles =
    useCallback(async () => {
      const {
        data,
        error
      } =
        await supabase
          .from('profiles')
          .select('*')
          .order(
            'created_at',
            {
              ascending: false
            }
          );

      if (error) {
        console.error(
          'Error fetching profiles:',
          error
        );

        return;
      }

      setDbUsers(
        (data || []).map(profile => ({
          id: profile.id,
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          role:
            profile.role ||
            'customer',
          address:
            profile.address || '',
          walletBalance:
            Number(
              profile.wallet_balance ??
              1000
            ),
          subscriptionActive:
            profile.subscription_active ??
            true,
          status:
            profile.status ||
            'Active',
          createdAt:
            formatDate(
              profile.created_at
            )
        }))
      );
    }, []);

  /*
   * ------------------------------------------------------------
   * SUBSCRIPTIONS
   *
   * THIS IS THE IMPORTANT PART FOR:
   *
   * Admin Daily Milk Subscriptions
   * Admin 5 AM Roster
   *
   * Data comes directly from:
   * public.subscriptions
   * ------------------------------------------------------------
   */

  const fetchSubscriptions =
    useCallback(async () => {
      try {
        if (!user?.id) {
          setSubscriptions([]);
          return;
        }

        /*
         * Admin:
         * fetch ALL subscriptions.
         *
         * Customer:
         * fetch ONLY their own subscriptions.
         */
        let query =
          supabase
            .from('subscriptions')
            .select('*')
            .order(
              'created_at',
              {
                ascending: false
              }
            );

        if (user.role !== 'admin') {
          query =
            query.eq(
              'user_id',
              user.id
            );
        }

        const {
          data:
          subscriptionRows,
          error:
          subscriptionError
        } = await query;

        if (subscriptionError) {
          console.error(
            'Error fetching subscriptions from Supabase:',
            subscriptionError
          );

          return;
        }

        const rows =
          subscriptionRows || [];

        if (!rows.length) {
          setSubscriptions([]);
          return;
        }

        /*
         * ------------------------------------------------------
         * LOAD PRODUCT INFORMATION
         * ------------------------------------------------------
         */

        const productIds =
          [
            ...new Set(
              rows
                .map(
                  row =>
                    row.product_id
                )
                .filter(Boolean)
            )
          ];

        let productsById = {};

        if (productIds.length) {
          const {
            data:
            productRows,
            error:
            productError
          } =
            await supabase
              .from('products')
              .select(
                'id,name,unit,price'
              )
              .in(
                'id',
                productIds
              );

          if (productError) {
            console.error(
              'Error fetching subscription products:',
              productError
            );
          } else {
            productsById =
              Object.fromEntries(
                (productRows || []).map(
                  product => [
                    String(
                      product.id
                    ),
                    product
                  ]
                )
              );
          }
        }

        /*
         * ------------------------------------------------------
         * LOAD CUSTOMER PROFILES FOR ADMIN
         * ------------------------------------------------------
         */

        let profilesById = {};

        if (
          user.role === 'admin'
        ) {
          const userIds =
            [
              ...new Set(
                rows
                  .map(
                    row =>
                      row.user_id
                  )
                  .filter(Boolean)
              )
            ];

          if (userIds.length) {
            const {
              data:
              profileRows,
              error:
              profileError
            } =
              await supabase
                .from('profiles')
                .select(
                  'id,name,email,phone,address'
                )
                .in(
                  'id',
                  userIds
                );

            if (profileError) {
              console.error(
                'Error fetching subscription customer profiles:',
                profileError
              );
            } else {
              profilesById =
                Object.fromEntries(
                  (
                    profileRows ||
                    []
                  ).map(
                    profile => [
                      String(
                        profile.id
                      ),
                      profile
                    ]
                  )
                );
            }
          }
        }

        /*
         * ------------------------------------------------------
         * MAP DATABASE RECORDS
         * ------------------------------------------------------
         */

        const mapped =
          rows.map(subscription => {
            const product =
              productsById[
              String(
                subscription.product_id
              )
              ];

            const customer =
              profilesById[
              String(
                subscription.user_id
              )
              ];

            return mapSubscription({
              subscription,
              product,
              customer,
              currentUser: user
            });
          });

        setSubscriptions(mapped);
      } catch (error) {
        console.error(
          'Subscription fetch exception:',
          error
        );
      }
    }, [
      user?.id,
      user?.role,
      user?.name,
      user?.email,
      user?.phone,
      user?.address
    ]);

  /*
   * ------------------------------------------------------------
   * 5 AM ROSTER DATA
   *
   * No new dashboard tab.
   *
   * This is derived directly from subscriptions.
   * ------------------------------------------------------------
   */

  const fiveAmRoster =
    subscriptions.filter(
      subscription =>
        subscription.status ===
        'Active' &&
        (
          subscription.deliverySlot ===
          DEFAULT_DELIVERY_SLOT ||
          subscription.deliverySlot
            ?.toLowerCase()
            .includes('5:30')
        )
    );

  /*
   * ------------------------------------------------------------
   * DELIVERIES
   * ------------------------------------------------------------
   */

  const fetchDeliveries =
    useCallback(async () => {
      if (!user?.id) return;

      let query =
        supabase
          .from('deliveries')
          .select('*')
          .order(
            'created_at',
            {
              ascending: false
            }
          );

      if (user.role !== 'admin') {
        query =
          query.eq(
            'customer_id',
            user.id
          );
      }

      const {
        data,
        error
      } = await query;

      if (error) {
        console.error(
          'Error fetching deliveries:',
          error
        );

        return;
      }

      setDistributionList(
        (data || []).map(
          delivery => ({
            id: delivery.id,
            customerId:
              delivery.customer_id,
            customerName:
              delivery.customer_name,
            address:
              delivery.address,
            phone:
              delivery.phone,
            quantity:
              delivery.quantity,
            product:
              delivery.product,
            deliverySlot:
              delivery.delivery_slot ||
              DEFAULT_DELIVERY_SLOT,
            bottleReturnCount:
              Number(
                delivery.bottle_return_count ||
                0
              ),
            status:
              delivery.status ||
              'Pending',
            date:
              delivery.delivery_date ||
              delivery.created_at
          })
        )
      );
    }, [
      user?.id,
      user?.role
    ]);

  /*
   * ------------------------------------------------------------
   * ORDERS
   * ------------------------------------------------------------
   */

  const fetchOrders =
    useCallback(async () => {
      if (!user?.id) return;

      let query =
        supabase
          .from('orders')
          .select(
            '*, order_items(*)'
          )
          .order(
            'created_at',
            {
              ascending: false
            }
          );

      if (user.role !== 'admin') {
        query =
          query.eq(
            'user_id',
            user.id
          );
      }

      const {
        data,
        error
      } = await query;

      if (error) {
        console.error(
          'Error fetching orders:',
          error
        );

        return;
      }

      setOrders(
        (data || []).map(
          order => ({
            id: order.id,
            userId:
              order.user_id,
            customerName:
              'Customer',
            customerEmail:
              '',
            totalAmount:
              Number(
                order.total_amount ||
                0
              ),
            status:
              order.status ||
              'Pending',
            deliverySlot:
              order.delivery_slot ||
              '',
            paymentMethod:
              order.payment_method ||
              '',
            deliveryAddress:
              order.delivery_address ||
              '',
            phone:
              order.phone ||
              '',
            instructions:
              order.instructions ||
              '',
            createdAt:
              order.created_at,
            date:
              formatDate(
                order.created_at
              ),

            items:
              (
                order.order_items ||
                []
              ).map(item => ({
                id: item.id,
                orderId:
                  item.order_id,
                productId:
                  item.product_id,
                productName:
                  item.product_name,
                quantity:
                  Number(
                    item.quantity ||
                    0
                  ),
                unitPrice:
                  Number(
                    item.unit_price ||
                    0
                  ),
                buyType:
                  item.buy_type ||
                  '',
                frequency:
                  item.frequency ||
                  ''
              }))
          })
        )
      );
    }, [
      user?.id,
      user?.role
    ]);

  /*
   * ------------------------------------------------------------
   * ONE-TIME ORDERS
   * ------------------------------------------------------------
   */

  const fetchOneTimeOrders =
    useCallback(async () => {
      if (
        !user?.id ||
        user.role !== 'admin'
      ) {
        return;
      }

      const {
        data,
        error
      } =
        await supabase
          .from('one_time_orders')
          .select('*')
          .order(
            'created_at',
            {
              ascending: false
            }
          );

      if (error) {
        console.error(
          'Error fetching one-time orders:',
          error
        );

        return;
      }

      setOneTimeOrders(
        (data || []).map(
          order => ({
            id: order.id,
            customerName:
              order.customer_name,
            customerEmail:
              order.customer_email,
            customerPhone:
              order.customer_phone,
            address:
              order.address,
            deliverySlot:
              order.delivery_slot,
            instructions:
              order.instructions ||
              '',
            items:
              order.items || [],
            totalAmount:
              Number(
                order.total_amount ||
                0
              ),
            paymentMethod:
              order.payment_method,
            paymentStatus:
              order.payment_status,
            status:
              order.status,
            orderDate:
              order.order_date,
            created_at:
              order.created_at
          })
        )
      );
    }, [
      user?.id,
      user?.role
    ]);

  /*
   * ------------------------------------------------------------
   * EMPLOYEES
   * ------------------------------------------------------------
   */

  const fetchEmployees =
    useCallback(async () => {
      if (
        !user?.id ||
        user.role !== 'admin'
      ) {
        return;
      }

      const {
        data,
        error
      } =
        await supabase
          .from('employees')
          .select('*')
          .order(
            'created_at',
            {
              ascending: false
            }
          );

      if (error) {
        console.error(
          'Error fetching employees:',
          error
        );

        return;
      }

      setEmployees(
        (data || []).map(
          employee => ({
            id: employee.id,
            name:
              employee.name,
            phone:
              employee.phone ||
              '',
            email:
              employee.email ||
              '',
            role:
              employee.role ||
              '',
            category:
              employee.category ||
              'Delivery Agent',
            address:
              employee.address ||
              '',
            joiningDate:
              employee.joining_date ||
              formatDate(
                employee.created_at
              ),
            salary:
              Number(
                employee.salary ||
                0
              ),
            status:
              employee.status ||
              'Active'
          })
        )
      );
    }, [
      user?.id,
      user?.role
    ]);

  /*
   * ------------------------------------------------------------
   * AUDIT LOGS
   * ------------------------------------------------------------
   */

  const fetchAuditLogs =
    useCallback(async () => {
      if (
        !user?.id ||
        user.role !== 'admin'
      ) {
        return;
      }

      const {
        data,
        error
      } =
        await supabase
          .from('audit_logs')
          .select('*')
          .order(
            'timestamp',
            {
              ascending: false
            }
          )
          .limit(50);

      if (error) {
        console.error(
          'Error fetching audit logs:',
          error
        );

        return;
      }

      setDbLogs(
        (data || []).map(
          log => ({
            id: log.id,
            action:
              log.action,
            description:
              log.description,
            timestamp:
              log.timestamp
                ? new Date(
                  log.timestamp
                ).toLocaleString()
                : ''
          })
        )
      );
    }, [
      user?.id,
      user?.role
    ]);

  /*
   * ------------------------------------------------------------
   * CONTACT QUERIES
   * ------------------------------------------------------------
   */

  const fetchContactQueries =
    useCallback(async () => {
      if (
        !user?.id ||
        user.role !== 'admin'
      ) {
        return;
      }

      const {
        data,
        error
      } =
        await supabase
          .from('contact_queries')
          .select('*')
          .neq(
            'status',
            'Completed'
          )
          .order(
            'created_at',
            {
              ascending: false
            }
          );

      if (error) {
        console.error(
          'Error fetching contact queries:',
          error
        );

        return;
      }

      setContactQueries(
        data || []
      );
    }, [
      user?.id,
      user?.role
    ]);

  /*
   * ------------------------------------------------------------
   * SUPABASE DATA LOAD + REALTIME
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (
      !isSupabaseConfigured() ||
      !authReady ||
      authLoading ||
      !user?.id
    ) {
      return undefined;
    }

    let mounted = true;

    const channels = [];

    const loadData = async () => {
      await fetchProducts();

      if (!mounted) return;

      if (user.role === 'admin') {
        await Promise.allSettled([
          fetchProfiles(),
          fetchSubscriptions(),
          fetchOrders(),
          fetchDeliveries(),
          fetchAuditLogs(),
          fetchContactQueries(),
          fetchOneTimeOrders(),
          fetchEmployees()
        ]);
      } else {
        await Promise.allSettled([
          fetchSubscriptions(),
          fetchOrders(),
          fetchDeliveries()
        ]);
      }
    };

    loadData();

    /*
     * ----------------------------------------------------------
     * PRODUCTS REALTIME
     * ----------------------------------------------------------
     */

    channels.push(
      supabase
        .channel(
          'srivari-products-realtime'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products'
          },
          () => {
            fetchProducts();
            fetchSubscriptions();
          }
        )
        .subscribe()
    );

    /*
     * ----------------------------------------------------------
     * SUBSCRIPTIONS REALTIME
     *
     * This is what keeps Admin 5 AM Roster updated.
     * ----------------------------------------------------------
     */

    channels.push(
      supabase
        .channel(
          'srivari-subscriptions-realtime'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions'
          },
          () => {
            fetchSubscriptions();
          }
        )
        .subscribe()
    );

    /*
     * ----------------------------------------------------------
     * CUSTOMER REALTIME
     * ----------------------------------------------------------
     */

    if (user.role !== 'admin') {
      channels.push(
        supabase
          .channel(
            'srivari-customer-orders'
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter:
                `user_id=eq.${user.id}`
            },
            () => {
              fetchOrders();
            }
          )
          .subscribe()
      );

      channels.push(
        supabase
          .channel(
            'srivari-customer-deliveries'
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'deliveries',
              filter:
                `customer_id=eq.${user.id}`
            },
            () => {
              fetchDeliveries();
            }
          )
          .subscribe()
      );
    }

    /*
     * ----------------------------------------------------------
     * ADMIN REALTIME
     * ----------------------------------------------------------
     */

    if (user.role === 'admin') {
      const adminTables = [
        [
          'profiles',
          fetchProfiles
        ],
        [
          'orders',
          fetchOrders
        ],
        [
          'deliveries',
          fetchDeliveries
        ],
        [
          'audit_logs',
          fetchAuditLogs
        ],
        [
          'contact_queries',
          fetchContactQueries
        ],
        [
          'one_time_orders',
          fetchOneTimeOrders
        ],
        [
          'employees',
          fetchEmployees
        ]
      ];

      adminTables.forEach(
        ([table, callback]) => {
          channels.push(
            supabase
              .channel(
                `srivari-admin-${table}`
              )
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table
                },
                callback
              )
              .subscribe()
          );
        }
      );
    }

    return () => {
      mounted = false;

      channels.forEach(
        channel => {
          try {
            supabase.removeChannel(
              channel
            );
          } catch (error) {
            console.error(
              'Realtime channel cleanup error:',
              error
            );
          }
        }
      );
    };
  }, [
    authReady,
    authLoading,
    user?.id,
    user?.role,

    fetchProducts,
    fetchProfiles,
    fetchSubscriptions,
    fetchOrders,
    fetchDeliveries,
    fetchAuditLogs,
    fetchContactQueries,
    fetchOneTimeOrders,
    fetchEmployees
  ]);

  /*
   * ------------------------------------------------------------
   * IDLE LOGOUT
   * ------------------------------------------------------------
   */

  const resetIdleTimer =
    useCallback(() => {
      if (idleTimerRef.current) {
        clearTimeout(
          idleTimerRef.current
        );

        idleTimerRef.current = null;
      }

      if (!user) return;

      idleTimerRef.current =
        setTimeout(
          async () => {
            try {
              if (
                isSupabaseConfigured()
              ) {
                await supabase.auth.signOut();
              }
            } catch (error) {
              console.error(
                'Automatic logout error:',
                error
              );
            } finally {
              setUser(null);

              localStorage.removeItem(
                'srivari_user'
              );

              showToast(
                'Logged out automatically due to 30 minutes of inactivity.',
                'info'
              );
            }
          },
          IDLE_TIMEOUT_MS
        );
    }, [
      user,
      showToast
    ]);

  useEffect(() => {
    if (!user) {
      if (
        idleTimerRef.current
      ) {
        clearTimeout(
          idleTimerRef.current
        );

        idleTimerRef.current =
          null;
      }

      return undefined;
    }

    const activityEvents = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
      'wheel'
    ];

    let throttleTimer = null;

    const handleActivity = () => {
      if (throttleTimer) return;

      throttleTimer =
        setTimeout(() => {
          throttleTimer = null;
          resetIdleTimer();
        }, 500);
    };

    activityEvents.forEach(
      event => {
        window.addEventListener(
          event,
          handleActivity,
          {
            passive: true
          }
        );
      }
    );

    resetIdleTimer();

    return () => {
      if (
        idleTimerRef.current
      ) {
        clearTimeout(
          idleTimerRef.current
        );

        idleTimerRef.current =
          null;
      }

      if (throttleTimer) {
        clearTimeout(
          throttleTimer
        );

        throttleTimer = null;
      }

      activityEvents.forEach(
        event => {
          window.removeEventListener(
            event,
            handleActivity
          );
        }
      );
    };
  }, [
    user,
    resetIdleTimer
  ]);

  /*
   * ------------------------------------------------------------
   * CART
   * ------------------------------------------------------------
   */

  useEffect(() => {
    try {
      localStorage.setItem(
        'srivari_cart',
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        'Cart localStorage error:',
        error
      );
    }
  }, [cart]);

  const addToCart = (
    product,
    quantity = 1,
    buyType = 'one-time',
    frequency = 'daily'
  ) => {
    if (
      buyType === 'subscription' &&
      !user
    ) {
      showToast(
        'Please log in to start a daily milk subscription.',
        'info'
      );

      navigate('/login');

      return false;
    }

    setCart(prevCart => {
      const cartItemId =
        `${product.id}-${buyType}-${frequency}`;

      const existingIndex =
        prevCart.findIndex(
          item =>
            item.id ===
            cartItemId
        );

      if (
        existingIndex >= 0
      ) {
        const updated = [
          ...prevCart
        ];

        updated[
          existingIndex
        ] = {
          ...updated[
          existingIndex
          ],
          quantity:
            Number(
              updated[
                existingIndex
              ].quantity || 0
            ) + Number(quantity)
        };

        return updated;
      }

      return [
        ...prevCart,
        {
          id: cartItemId,
          productId:
            product.id,
          product,
          quantity:
            Number(quantity),
          buyType,
          frequency,
          startDate:
            new Date()
              .toISOString()
              .split('T')[0],
          bottleType:
            'glass'
        }
      ];
    });

    showToast(
      `Added ${product.name} (${buyType === 'subscription'
        ? 'Subscription'
        : 'One-time'
      }) to cart!`
    );

    return true;
  };

  const removeFromCart =
    cartItemId => {
      setCart(prev =>
        prev.filter(
          item =>
            item.id !==
            cartItemId
        )
      );

      showToast(
        'Item removed from cart',
        'info'
      );
    };

  const updateCartQuantity =
    (cartItemId, delta) => {
      setCart(prev =>
        prev.map(item => {
          if (
            item.id !==
            cartItemId
          ) {
            return item;
          }

          const newQuantity =
            Number(
              item.quantity || 0
            ) +
            Number(delta);

          return newQuantity >
            0
            ? {
              ...item,
              quantity:
                newQuantity
            }
            : item;
        })
      );
    };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.product?.price ||
          0
        ) *
        Number(
          item.quantity ||
          0
        ),
      0
    );

  const cartItemCount =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity ||
          0
        ),
      0
    );

  /*
   * ------------------------------------------------------------
   * AUTHENTICATION
   * ------------------------------------------------------------
   */

  const signUpCustomer =
    async ({
      name,
      email,
      phone,
      address,
      password
    }) => {
      if (
        !isSupabaseConfigured()
      ) {
        showToast(
          'Supabase is not configured.',
          'error'
        );

        return false;
      }

      try {
        const normalizedEmail =
          email
            .trim()
            .toLowerCase();

        const {
          data,
          error
        } =
          await supabase.auth.signUp({
            email:
              normalizedEmail,
            password,

            options: {
              data: {
                name,
                phone:
                  phone || '',
                address:
                  address || '',
                role:
                  'customer'
              }
            }
          });

        if (error) {
          throw error;
        }

        const authUser =
          data?.user;

        if (!authUser) {
          throw new Error(
            'Supabase did not return a user.'
          );
        }

        /*
         * When email confirmation is disabled,
         * create/update profile immediately.
         *
         * When email confirmation is enabled,
         * the profile should normally be created
         * by your database trigger.
         */
        if (data.session) {
          const {
            error:
            profileError
          } =
            await supabase
              .from('profiles')
              .upsert(
                {
                  id:
                    authUser.id,
                  name,
                  email:
                    normalizedEmail,
                  phone:
                    phone || '',
                  address:
                    address || '',
                  role:
                    'customer',
                  wallet_balance:
                    1000,
                  status:
                    'Active'
                },
                {
                  onConflict:
                    'id'
                }
              );

          if (
            profileError
          ) {
            throw profileError;
          }
        }

        showToast(
          data.session
            ? 'Signup successful. You are now logged in.'
            : 'Account created. Please verify your email, then log in.',
          'success'
        );

        return true;
      } catch (error) {
        console.error(
          'Supabase signup error:',
          error
        );

        showToast(
          error?.message ||
          'Signup failed.',
          'error'
        );

        return false;
      }
    };

  const login =
    async (
      email,
      password,
      role = 'customer'
    ) => {
      if (
        !email ||
        !password
      ) {
        showToast(
          'Email and password are required.',
          'error'
        );

        return false;
      }

      if (
        !isSupabaseConfigured()
      ) {
        showToast(
          'Supabase is not configured.',
          'error'
        );

        return false;
      }

      try {
        const normalizedEmail =
          email
            .trim()
            .toLowerCase();

        const {
          data,
          error
        } =
          await supabase.auth.signInWithPassword(
            {
              email:
                normalizedEmail,
              password
            }
          );

        if (error) {
          throw error;
        }

        if (!data?.user) {
          throw new Error(
            'Login succeeded but no Supabase user was returned.'
          );
        }

        const {
          data:
          profile,
          error:
          profileError
        } =
          await supabase
            .from('profiles')
            .select('*')
            .eq(
              'id',
              data.user.id
            )
            .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (
          !profile ||
          ['Deleted', 'Inactive'].includes(
            profile.status
          )
        ) {
          await supabase.auth.signOut();

          throw new Error(
            'Account is not active.'
          );
        }

        const userRole =
          profile.role ||
          data.user
            .user_metadata
            ?.role ||
          'customer';

        if (
          role === 'admin' &&
          userRole !== 'admin'
        ) {
          await supabase.auth.signOut();

          showToast(
            'Access denied: this account does not have Admin privileges.',
            'error'
          );

          return false;
        }

        const loggedInUser = {
          id:
            profile.id ||
            data.user.id,

          name:
            profile.name ||
            data.user
              .user_metadata
              ?.name ||
            data.user.email,

          email:
            profile.email ||
            data.user.email,

          phone:
            profile.phone ||
            '',

          address:
            profile.address ||
            '',

          role:
            userRole,

          walletBalance:
            Number(
              profile.wallet_balance ??
              (
                userRole ===
                  'admin'
                  ? 50000
                  : 1000
              )
            ),

          status:
            profile.status ||
            'Active'
        };

        setUser(
          loggedInUser
        );

        await logAction(
          'USER_LOGIN',
          `Logged in user: ${loggedInUser.name} (${loggedInUser.role})`
        );

        showToast(
          `Welcome back, ${loggedInUser.name}!`
        );

        return true;
      } catch (error) {
        console.error(
          'Supabase authentication error:',
          error
        );

        showToast(
          error?.message ||
          'Invalid credentials.',
          'error'
        );

        return false;
      }
    };

  const logout =
    async () => {
      try {
        if (
          isSupabaseConfigured()
        ) {
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error(
          'Supabase logout error:',
          error
        );
      }

      setUser(null);

      setSubscriptions([]);
      setOrders([]);
      setDistributionList([]);

      localStorage.removeItem(
        'srivari_user'
      );

      showToast(
        'Logged out successfully',
        'info'
      );
    };

  /*
   * ------------------------------------------------------------
   * CREATE SUBSCRIPTION
   * ------------------------------------------------------------
   */

  const createSubscription =
    async ({
      item,
      deliverySlot
    }) => {
      if (!user?.id) {
        showToast(
          'Please log in to start a milk subscription.',
          'error'
        );

        return null;
      }

      if (
        !isSupabaseConfigured()
      ) {
        showToast(
          'Supabase is not configured.',
          'error'
        );

        return null;
      }

      try {
        const productId =
          String(
            item?.productId ||
            item?.product_id ||
            item?.product?.id ||
            ''
          );

        const quantity =
          Number(
            item?.quantity || 1
          );

        if (
          !productId ||
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          throw new Error(
            'Invalid subscription product or quantity.'
          );
        }

        /*
         * ALWAYS get product price from Supabase.
         */
        const {
          data: product,
          error:
          productError
        } =
          await supabase
            .from('products')
            .select(
              'id,name,unit,price,subscription_available,in_stock,stock_count'
            )
            .eq(
              'id',
              productId
            )
            .single();

        if (
          productError ||
          !product
        ) {
          throw (
            productError ||
            new Error(
              'Subscription product was not found.'
            )
          );
        }

        if (
          product.subscription_available ===
          false
        ) {
          throw new Error(
            `${product.name} is not available for subscription.`
          );
        }

        if (
          product.in_stock ===
          false ||
          Number(
            product.stock_count ||
            0
          ) < quantity
        ) {
          throw new Error(
            `${product.name} does not have enough stock.`
          );
        }

        const startDate =
          item?.startDate ||
          new Date()
            .toISOString()
            .split('T')[0];

        /*
         * IMPORTANT:
         * Store "daily" in the database because
         * subscriptions.frequency has default "daily".
         */
        const frequency =
          item?.frequency ===
            'alternate'
            ? 'alternate'
            : 'daily';

        const dailyPrice =
          Number(
            product.price || 0
          ) * quantity;

        const {
          data:
          createdSubscription,
          error:
          subscriptionError
        } =
          await supabase
            .from('subscriptions')
            .insert({
              user_id:
                user.id,

              product_id:
                String(
                  product.id
                ),

              quantity,

              frequency,

              delivery_slot:
                deliverySlot ||
                DEFAULT_DELIVERY_SLOT,

              status:
                'Active',

              start_date:
                startDate,

              price_per_day:
                dailyPrice,

              bottles_exchanged:
                0
            })
            .select('*')
            .single();

        if (
          subscriptionError
        ) {
          console.error(
            'Supabase subscription insert error:',
            subscriptionError
          );

          throw subscriptionError;
        }

        /*
         * Immediately refresh the real Supabase
         * subscription list.
         *
         * This makes the new subscription available
         * to the customer dashboard AND admin dashboard.
         */
        await fetchSubscriptions();

        await logAction(
          'SUBSCRIPTION_CREATED',
          `Subscription created for ${product.name}: ${quantity} ${product.unit || 'Liter'} / ${frequency}`
        );

        showToast(
          'Milk subscription started successfully!',
          'success'
        );

        return createdSubscription;
      } catch (error) {
        console.error(
          'Supabase subscription creation failed:',
          error
        );

        showToast(
          error?.message ||
          'Unable to create the milk subscription.',
          'error'
        );

        return null;
      }
    };

  /*
   * ------------------------------------------------------------
   * PAUSE / RESUME SUBSCRIPTION
   * ------------------------------------------------------------
   */

  const toggleSubscriptionPause =
    async subId => {
      if (!user?.id) {
        return;
      }

      const current =
        subscriptions.find(
          sub =>
            sub.id ===
            subId
        );

      if (!current) {
        return;
      }

      /*
       * Customers can only change their own
       * subscriptions.
       */
      const query =
        supabase
          .from('subscriptions')
          .update({
            status:
              current.status ===
                'Active'
                ? 'Paused'
                : 'Active'
          })
          .eq(
            'id',
            subId
          )
          .eq(
            'user_id',
            user.id
          )
          .select('*')
          .single();

      const {
        data,
        error
      } = await query;

      if (error) {
        console.error(
          'Subscription status update failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return;
      }

      setSubscriptions(
        prev =>
          prev.map(sub =>
            sub.id ===
              subId
              ? {
                ...sub,
                status:
                  data.status
              }
              : sub
          )
      );

      await logAction(
        'SUBSCRIPTION_STATUS_CHANGED',
        `Subscription ${subId} changed to ${data.status}`
      );

      showToast(
        data.status ===
          'Active'
          ? 'Subscription resumed'
          : 'Subscription paused'
      );
    };

  /*
   * ------------------------------------------------------------
   * UPDATE SUBSCRIPTION QUANTITY
   * ------------------------------------------------------------
   */

  const updateSubscriptionQty =
    async (
      subId,
      newQty
    ) => {
      const quantity =
        Number(newQty);

      if (
        !user?.id ||
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        showToast(
          'Invalid subscription quantity.',
          'error'
        );

        return;
      }

      const current =
        subscriptions.find(
          sub =>
            sub.id ===
            subId
        );

      if (!current) {
        return;
      }

      const product =
        products.find(
          p =>
            p.id ===
            current.productId
        );

      if (
        product &&
        Number(
          product.stockCount ||
          0
        ) < quantity
      ) {
        showToast(
          'Requested quantity is not available in stock.',
          'error'
        );

        return;
      }

      const pricePerDay =
        product
          ? Number(
            product.price ||
            0
          ) * quantity
          : Number(
            current.pricePerDay ||
            0
          );

      const {
        data,
        error
      } =
        await supabase
          .from('subscriptions')
          .update({
            quantity,
            price_per_day:
              pricePerDay
          })
          .eq(
            'id',
            subId
          )
          .eq(
            'user_id',
            user.id
          )
          .select('*')
          .single();

      if (error) {
        console.error(
          'Subscription quantity update failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return;
      }

      setSubscriptions(
        prev =>
          prev.map(sub =>
            sub.id ===
              subId
              ? {
                ...sub,
                quantity:
                  data.quantity,
                pricePerDay:
                  Number(
                    data.price_per_day ||
                    0
                  )
              }
              : sub
          )
      );

      await logAction(
        'SUBSCRIPTION_UPDATED',
        `Subscription ${subId} quantity changed to ${quantity}`
      );

      showToast(
        `Subscription updated to ${quantity} ${product?.unit ||
        'Liter'
        } / day`
      );
    };

  /*
   * ------------------------------------------------------------
   * ONE-TIME ORDER
   * ------------------------------------------------------------
   */

  const placeOneTimeOrder =
    async details => {
      if (
        !isSupabaseConfigured()
      ) {
        showToast(
          'Supabase is not configured.',
          'error'
        );

        return null;
      }

      if (!cart.length) {
        showToast(
          'Your cart is empty.',
          'error'
        );

        return null;
      }

      try {
        const rpcItems =
          cart.map(item => ({
            product_id:
              String(
                item.productId ||
                item.product_id ||
                item.product?.id ||
                ''
              ),

            quantity:
              Number(
                item.quantity ||
                1
              )
          }));

        const {
          data,
          error
        } =
          await supabase.rpc(
            'create_one_time_order',
            {
              p_customer_name:
                String(
                  details?.customerName ||
                  user?.name ||
                  ''
                ).trim(),

              p_customer_email:
                String(
                  details?.customerEmail ||
                  user?.email ||
                  ''
                )
                  .trim()
                  .toLowerCase(),

              p_customer_phone:
                String(
                  details?.customerPhone ||
                  user?.phone ||
                  ''
                ).trim(),

              p_address:
                String(
                  details?.address ||
                  user?.address ||
                  ''
                ).trim(),

              p_items:
                rpcItems,

              p_delivery_slot:
                details?.deliverySlot ||
                DEFAULT_DELIVERY_SLOT,

              p_instructions:
                String(
                  details?.instructions ||
                  ''
                ).trim() ||
                null,

              p_payment_method:
                details?.paymentMethod ||
                'UPI Instant Pay'
            }
          );

        if (error) {
          throw error;
        }

        const createdOrder =
          Array.isArray(data)
            ? data[0]
            : data;

        clearCart();

        setCheckoutOpen(
          false
        );

        await fetchOrders();

        await logAction(
          'ONE_TIME_ORDER_PLACED',
          `One-time order ${createdOrder?.id || 'created'} placed`
        );

        showToast(
          'Order confirmed successfully!',
          'success'
        );

        return createdOrder;
      } catch (error) {
        console.error(
          'One-time order creation failed:',
          error
        );

        showToast(
          error?.message ||
          'Unable to place your order.',
          'error'
        );

        return null;
      }
    };

  /*
   * ------------------------------------------------------------
   * PLACE ORDER
   * ------------------------------------------------------------
   */

  const placeOrder =
    async paymentDetails => {
      const hasSubscriptions =
        cart.some(
          item =>
            item.buyType ===
            'subscription'
        );

      const hasOneTime =
        cart.some(
          item =>
            item.buyType !==
            'subscription'
        );

      if (
        hasSubscriptions &&
        hasOneTime
      ) {
        showToast(
          'Please checkout subscription and one-time items separately.',
          'error'
        );

        return false;
      }

      if (
        hasSubscriptions
      ) {
        if (!user) {
          showToast(
            'Please log in to start a subscription.',
            'error'
          );

          return false;
        }

        const created = [];

        for (
          const item of cart
        ) {
          const subscription =
            await createSubscription({
              item,
              deliverySlot:
                paymentDetails?.deliverySlot
            });

          if (
            !subscription
          ) {
            return false;
          }

          created.push(
            subscription
          );
        }

        clearCart();

        setCheckoutOpen(
          false
        );

        await fetchSubscriptions();

        showToast(
          'Milk subscription started successfully!',
          'success'
        );

        return created;
      }

      return placeOneTimeOrder(
        paymentDetails || {}
      );
    };

  /*
   * ------------------------------------------------------------
   * PRODUCT OPERATIONS
   * ------------------------------------------------------------
   */

  const updateProductStockOrPrice =
    async (
      productId,
      updates
    ) => {
      const dbUpdates = {};

      if (
        updates.price !==
        undefined
      ) {
        dbUpdates.price =
          Number(
            updates.price
          );
      }

      if (
        updates.stockCount !==
        undefined
      ) {
        dbUpdates.stock_count =
          Number(
            updates.stockCount
          );
      }

      if (
        updates.inStock !==
        undefined
      ) {
        dbUpdates.in_stock =
          updates.inStock;
      }

      if (
        updates.nutritionalInfo !==
        undefined
      ) {
        dbUpdates.nutritional_info =
          updates.nutritionalInfo;
      }

      if (
        updates.name !==
        undefined
      ) {
        dbUpdates.name =
          updates.name;
      }

      if (
        updates.category !==
        undefined
      ) {
        dbUpdates.category =
          updates.category;
      }

      const {
        error
      } =
        await supabase
          .from('products')
          .update(
            dbUpdates
          )
          .eq(
            'id',
            productId
          );

      if (error) {
        console.error(
          'Product update failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchProducts();

      await logAction(
        'PRODUCT_UPDATED',
        `Updated product ID: ${productId}`
      );

      showToast(
        'Product updated successfully!'
      );

      return true;
    };

  const addProduct =
    async newProdData => {
      const prodId =
        newProdData.id ||
        `p-${Date.now()}`;

      const productData = {
        id: prodId,
        name:
          newProdData.name,
        category:
          newProdData.category,
        price:
          Number(
            newProdData.price ||
            0
          ),
        unit:
          newProdData.unit ||
          '',
        rating: 5,
        reviews_count: 1,
        image:
          newProdData.image ||
          '',
        badge:
          'New Launch',
        description:
          newProdData.description ||
          '',
        in_stock: true,
        stock_count: 100,
        subscription_available:
          true,
        nutritional_info:
          newProdData.nutritionalInfo ||
          {}
      };

      const {
        error
      } =
        await supabase
          .from('products')
          .insert(
            productData
          );

      if (error) {
        console.error(
          'Product insert failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchProducts();

      await logAction(
        'PRODUCT_ADDED',
        `Added product: ${newProdData.name}`
      );

      showToast(
        `Added ${newProdData.name} to database!`
      );

      return true;
    };

  const deleteProduct =
    async productId => {
      const {
        error
      } =
        await supabase
          .from('products')
          .delete()
          .eq(
            'id',
            productId
          );

      if (error) {
        console.error(
          'Product delete failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      setProducts(
        prev =>
          prev.filter(
            product =>
              product.id !==
              productId
          )
      );

      await logAction(
        'PRODUCT_DELETED',
        `Deleted product ID: ${productId}`
      );

      showToast(
        'Product deleted.',
        'info'
      );

      return true;
    };

  /*
   * ------------------------------------------------------------
   * USER OPERATIONS
   * ------------------------------------------------------------
   */

  const addDbUser =
    async userData => {
      const targetId =
        userData.id ||
        generateUuid();

      const {
        error
      } =
        await supabase
          .from('profiles')
          .upsert(
            {
              id: targetId,
              name:
                userData.name,
              email:
                userData.email
                  ?.trim()
                  .toLowerCase(),
              phone:
                userData.phone ||
                '',
              role:
                userData.role ||
                'customer',
              address:
                userData.address ||
                '',
              wallet_balance:
                Number(
                  userData.walletBalance ||
                  1000
                ),
              status:
                'Active'
            },
            {
              onConflict:
                'id'
            }
          );

      if (error) {
        console.error(
          'User insert failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return null;
      }

      await fetchProfiles();

      await logAction(
        'USER_CREATED',
        `Created user: ${userData.name}`
      );

      showToast(
        `Created ${userData.name}`
      );

      return {
        id: targetId,
        ...userData
      };
    };

  const updateDbUser =
    async (
      userId,
      updates
    ) => {
      const dbUpdates = {};

      if (
        updates.name !==
        undefined
      )
        dbUpdates.name =
          updates.name;

      if (
        updates.email !==
        undefined
      )
        dbUpdates.email =
          updates.email;

      if (
        updates.phone !==
        undefined
      )
        dbUpdates.phone =
          updates.phone;

      if (
        updates.role !==
        undefined
      )
        dbUpdates.role =
          updates.role;

      if (
        updates.address !==
        undefined
      )
        dbUpdates.address =
          updates.address;

      if (
        updates.walletBalance !==
        undefined
      )
        dbUpdates.wallet_balance =
          Number(
            updates.walletBalance
          );

      if (
        updates.status !==
        undefined
      )
        dbUpdates.status =
          updates.status;

      const {
        error
      } =
        await supabase
          .from('profiles')
          .update(
            dbUpdates
          )
          .eq(
            'id',
            userId
          );

      if (error) {
        console.error(
          'User update failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchProfiles();

      if (
        user?.id ===
        userId
      ) {
        setUser(
          prev => ({
            ...prev,
            ...updates
          })
        );
      }

      await logAction(
        'USER_UPDATED',
        `Updated user ID: ${userId}`
      );

      return true;
    };

  const deleteDbUser =
    async userId => {
      const {
        error
      } =
        await supabase
          .from('profiles')
          .update({
            status:
              'Deleted'
          })
          .eq(
            'id',
            userId
          );

      if (error) {
        console.error(
          'User delete failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchProfiles();

      await logAction(
        'USER_DELETED',
        `Deleted user ID: ${userId}`
      );

      showToast(
        'User account removed.',
        'info'
      );

      return true;
    };

  /*
   * ------------------------------------------------------------
   * DELIVERY
   * ------------------------------------------------------------
   */

  const updateDistributionStatus =
    async (
      distId,
      newStatus
    ) => {
      const {
        error
      } =
        await supabase
          .from('deliveries')
          .update({
            status:
              newStatus
          })
          .eq(
            'id',
            distId
          );

      if (error) {
        console.error(
          'Delivery update failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      setDistributionList(
        prev =>
          prev.map(
            delivery =>
              delivery.id ===
                distId
                ? {
                  ...delivery,
                  status:
                    newStatus
                }
                : delivery
          )
      );

      await logAction(
        'DELIVERY_STATUS_CHANGED',
        `Updated delivery ${distId} to ${newStatus}`
      );

      showToast(
        `Delivery status updated to ${newStatus}`
      );

      return true;
    };

  /*
   * ------------------------------------------------------------
   * ONE-TIME ORDER ADMIN OPERATIONS
   * ------------------------------------------------------------
   */

  const updateOneTimeOrderStatus =
    async (
      orderId,
      newStatus
    ) => {
      const {
        error
      } =
        await supabase
          .from('one_time_orders')
          .update({
            status:
              newStatus
          })
          .eq(
            'id',
            orderId
          );

      if (error) {
        console.error(
          'One-time order status update failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchOneTimeOrders();

      return true;
    };

  const updateOneTimePaymentStatus =
    async (
      orderId,
      paymentStatus
    ) => {
      const {
        error
      } =
        await supabase
          .from('one_time_orders')
          .update({
            payment_status:
              paymentStatus
          })
          .eq(
            'id',
            orderId
          );

      if (error) {
        console.error(
          'Payment status update failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchOneTimeOrders();

      return true;
    };

  /*
   * ------------------------------------------------------------
   * CONTACT QUERIES
   * ------------------------------------------------------------
   */

  const submitContactQuery =
    async ({
      name,
      email,
      phone,
      subject,
      message
    }) => {
      const {
        error
      } =
        await supabase
          .from('contact_queries')
          .insert({
            name,
            email,
            phone:
              phone || '',
            subject:
              subject ||
              'Milk Subscription Inquiry',
            message,
            status:
              'Pending'
          });

      if (error) {
        console.error(
          'Contact query insert failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchContactQueries();

      showToast(
        'Message sent successfully!'
      );

      return true;
    };

  const updateContactQueryStatus =
    async (
      queryId,
      newStatus
    ) => {
      const {
        error
      } =
        await supabase
          .from('contact_queries')
          .update({
            status:
              newStatus
          })
          .eq(
            'id',
            queryId
          );

      if (error) {
        console.error(
          'Contact query update failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchContactQueries();

      return true;
    };

  const deleteContactQuery =
    async queryId => {
      const {
        error
      } =
        await supabase
          .from('contact_queries')
          .delete()
          .eq(
            'id',
            queryId
          );

      if (error) {
        console.error(
          'Contact query delete failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchContactQueries();

      return true;
    };

  /*
   * ------------------------------------------------------------
   * EMPLOYEES
   * ------------------------------------------------------------
   */

  const addEmployee =
    async empData => {
      const employee = {
        id:
          empData.id ||
          generateUuid(),

        name:
          empData.name,

        phone:
          empData.phone ||
          '',

        email:
          empData.email ||
          '',

        role:
          empData.role ||
          'Delivery Agent',

        category:
          empData.category ||
          'Delivery Agent',

        address:
          empData.address ||
          '',

        joining_date:
          empData.joiningDate ||
          new Date()
            .toISOString()
            .split('T')[0],

        salary:
          Number(
            empData.salary ||
            20000
          ),

        status:
          empData.status ||
          'Active'
      };

      const {
        error
      } =
        await supabase
          .from('employees')
          .upsert(
            employee,
            {
              onConflict:
                'id'
            }
          );

      if (error) {
        console.error(
          'Employee insert failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchEmployees();

      await logAction(
        'EMPLOYEE_ADDED',
        `Added employee: ${empData.name}`
      );

      return true;
    };

  const updateEmployee =
    async (
      empId,
      updates
    ) => {
      const dbUpdates = {};

      if (
        updates.name !==
        undefined
      )
        dbUpdates.name =
          updates.name;

      if (
        updates.phone !==
        undefined
      )
        dbUpdates.phone =
          updates.phone;

      if (
        updates.email !==
        undefined
      )
        dbUpdates.email =
          updates.email;

      if (
        updates.role !==
        undefined
      )
        dbUpdates.role =
          updates.role;

      if (
        updates.category !==
        undefined
      )
        dbUpdates.category =
          updates.category;

      if (
        updates.address !==
        undefined
      )
        dbUpdates.address =
          updates.address;

      if (
        updates.joiningDate !==
        undefined
      )
        dbUpdates.joining_date =
          updates.joiningDate;

      if (
        updates.salary !==
        undefined
      )
        dbUpdates.salary =
          Number(
            updates.salary
          );

      if (
        updates.status !==
        undefined
      )
        dbUpdates.status =
          updates.status;

      const {
        error
      } =
        await supabase
          .from('employees')
          .update(
            dbUpdates
          )
          .eq(
            'id',
            empId
          );

      if (error) {
        console.error(
          'Employee update failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchEmployees();

      return true;
    };

  const deleteEmployee =
    async empId => {
      const {
        error
      } =
        await supabase
          .from('employees')
          .delete()
          .eq(
            'id',
            empId
          );

      if (error) {
        console.error(
          'Employee delete failed:',
          error
        );

        showToast(
          error.message,
          'error'
        );

        return false;
      }

      await fetchEmployees();

      return true;
    };

  /*
   * ------------------------------------------------------------
   * DATABASE BACKUP
   * ------------------------------------------------------------
   */

  const exportDatabaseBackup =
    () => {
      const backup = {
        version: '4.0',
        timestamp:
          new Date().toISOString(),
        users: dbUsers,
        products,
        deliveries:
          distributionList,
        subscriptions,
        orders,
        logs: dbLogs
      };

      const blob =
        new Blob(
          [
            JSON.stringify(
              backup,
              null,
              2
            )
          ],
          {
            type:
              'application/json'
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          'a'
        );

      link.href = url;

      link.download =
        `srivari_database_backup_${new Date()
          .toISOString()
          .split('T')[0]}.json`;

      link.click();

      URL.revokeObjectURL(
        url
      );

      showToast(
        'Database backup exported successfully!'
      );
    };

  const importDatabaseBackup =
    async jsonString => {
      try {
        const data =
          JSON.parse(
            jsonString
          );

        if (
          !isSupabaseConfigured()
        ) {
          throw new Error(
            'Supabase is not configured.'
          );
        }

        if (
          Array.isArray(
            data.products
          )
        ) {
          for (
            const product of data.products
          ) {
            const {
              error
            } =
              await supabase
                .from(
                  'products'
                )
                .upsert({
                  id:
                    product.id,
                  name:
                    product.name,
                  category:
                    product.category,
                  price:
                    Number(
                      product.price ||
                      0
                    ),
                  unit:
                    product.unit ||
                    '',
                  image:
                    product.image ||
                    '',
                  description:
                    product.description ||
                    '',
                  in_stock:
                    product.inStock,
                  stock_count:
                    Number(
                      product.stockCount ||
                      0
                    ),
                  subscription_available:
                    product.subscriptionAvailable,
                  nutritional_info:
                    product.nutritionalInfo ||
                    {}
                });

            if (error) {
              throw error;
            }
          }
        }

        await fetchProducts();

        showToast(
          'Product data restored successfully.'
        );

        return true;
      } catch (error) {
        console.error(
          'Backup restore failed:',
          error
        );

        showToast(
          error?.message ||
          'Invalid backup file.',
          'error'
        );

        return false;
      }
    };

  const resetDatabaseToDefaults =
    async () => {
      showToast(
        'Factory reset is disabled for the live Supabase database.',
        'info'
      );
    };

  /*
   * ------------------------------------------------------------
   * CONTEXT
   * ------------------------------------------------------------
   */

  return (
    <AppContext.Provider
      value={{
        /*
         * Auth
         */
        user,
        setUser,
        login,
        logout,
        signUpCustomer,
        authLoading,
        authReady,

        /*
         * Supabase
         */
        supabaseActive,

        /*
         * Products
         */
        products,
        setProducts,
        updateProductStockOrPrice,
        addProduct,
        deleteProduct,

        /*
         * Users
         */
        dbUsers,
        addDbUser,
        updateDbUser,
        deleteDbUser,

        /*
         * Subscriptions
         */
        subscriptions,
        fiveAmRoster,
        createSubscription,
        toggleSubscriptionPause,
        updateSubscriptionQty,
        fetchSubscriptions,

        /*
         * Orders
         */
        orders,
        placeOrder,
        placeOneTimeOrder,

        /*
         * Deliveries
         */
        distributionList,
        updateDistributionStatus,

        /*
         * One-time orders
         */
        oneTimeOrders,
        updateOneTimeOrderStatus,
        updateOneTimePaymentStatus,

        /*
         * Employees
         */
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,

        /*
         * Contact queries
         */
        contactQueries,
        submitContactQuery,
        updateContactQueryStatus,
        deleteContactQuery,

        /*
         * Audit
         */
        dbLogs,
        logAction,

        /*
         * Cart
         */
        cart,
        cartOpen,
        setCartOpen,
        checkoutOpen,
        setCheckoutOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartItemCount,

        /*
         * Lab
         */
        selectedLabProduct,
        setSelectedLabProduct,

        /*
         * UI
         */
        toast,
        showToast,

        /*
         * Backup
         */
        exportDatabaseBackup,
        importDatabaseBackup,
        resetDatabaseToDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () =>
  useContext(AppContext);