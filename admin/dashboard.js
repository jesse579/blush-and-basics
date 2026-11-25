
import { supabase } from './supabase-config.js';

const status = document.querySelector('#status');
const logoutBtn = document.querySelector('#logoutBtn');
const categoryList = document.querySelector('#categoryList');

const categoryName = document.querySelector('#categoryName');
const categoryGender = document.querySelector('#categoryGender');
const categoryImage = document.querySelector('#categoryImage');
const categoryOrder = document.querySelector('#categoryOrder');
const saveCategoryBtn = document.querySelector('#saveCategoryBtn');
const categoryFormMessage = document.querySelector('#categoryFormMessage');

const categoryForm = document.querySelector('#categoryForm');
const showCategoryForm = document.querySelector('#showCategoryForm');
const cancelCategoryForm = document.querySelector('#cancelCategoryForm');
// Product form elements
const productForm = document.querySelector('#productForm');
// Product listing
const productList = document.querySelector('#productList');
// Tracks the product currently being edited
let editingProductId = null;
let editingProductImageUrl = null;
let editingProductImages = [];
const showProductForm = document.querySelector('#showProductForm');
const cancelProductForm = document.querySelector('#cancelProductForm');

// Product form fields
const productName = document.querySelector('#productName');
const productCategory = document.querySelector('#productCategory');
const productGender = document.querySelector('#productGender');
const productDescription = document.querySelector('#productDescription');
const productPrice = document.querySelector('#productPrice');
const productComparePrice = document.querySelector('#productComparePrice');
const productStock = document.querySelector('#productStock');
const productImage = document.querySelector('#productImage');
const productColors = document.querySelector('#productColors');
const productBestSeller = document.querySelector('#productBestSeller');
const productActive = document.querySelector('#productActive');

const productBandSizes = document.querySelector('#productBandSizes');
const productCupSizes = document.querySelector('#productCupSizes');
const productClothingSizes = document.querySelector('#productClothingSizes');

const productFormMessage = document.querySelector('#productFormMessage');
const saveProductBtn = document.querySelector('#saveProductBtn');
// Show product form
showProductForm.addEventListener('click', () => {
  productForm.hidden = false;
  showProductForm.hidden = true;
});

// Hide product form
cancelProductForm.addEventListener('click', () => {
  productForm.reset();

  editingProductId = null;
  editingProductImageUrl = null;
  editingProductImages = [];

  productFormMessage.textContent = '';
  saveProductBtn.textContent = 'Save Product';

  productForm.hidden = true;
  showProductForm.hidden = false;

  updateSizeFields();
});

const productType = document.querySelector('#productType');
const braSizeFields = document.querySelector('#braSizeFields');
const clothingSizeFields = document.querySelector('#clothingSizeFields');

function getProductStoragePath(url) {
  try {
    const imageUrl = new URL(url);

    const marker =
      '/storage/v1/object/public/category-images/';

    const markerIndex = imageUrl.pathname.indexOf(marker);

    if (markerIndex === -1) return null;

    const path = decodeURIComponent(
      imageUrl.pathname.slice(markerIndex + marker.length)
    );

    return path.startsWith('products/') ? path : null;

  } catch {
    return null;
  }
}

// Show the appropriate size fields
function updateSizeFields() {
  const type = productType.value;

  braSizeFields.hidden = type !== 'bra';
  clothingSizeFields.hidden = type !== 'clothing';
}

// Listen for changes
productType.addEventListener('change', updateSizeFields);

// Set the correct fields when the dashboard loads
updateSizeFields();


if (categoryForm && showCategoryForm && cancelCategoryForm) {

  showCategoryForm.addEventListener('click', () => {
    categoryForm.hidden = false;
    showCategoryForm.hidden = true;
  });

  cancelCategoryForm.addEventListener('click', () => {
    categoryForm.reset();
    categoryForm.hidden = true;
    showCategoryForm.hidden = false;
  });

} else {
  console.error('Category form elements could not be found.');
}

// Check that the visitor is an authenticated administrator.
async function protectDashboard() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.replace('./login.html');
    return false;
  }

  if (user.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut();
    window.location.replace('./login.html');
    return false;
  }

  status.textContent = `Welcome, ${user.email}. Your administrator access is verified.`;
  logoutBtn.hidden = false;

  return true;
}

// Display categories retrieved from Supabase.
async function loadCategories() {
  if (!categoryList) return;

  categoryList.textContent = 'Loading categories...';

  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, gender, image_url, sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    categoryList.textContent = `Could not load categories: ${error.message}`;
    return;
  }

  if (!categories || categories.length === 0) {
    categoryList.textContent = 'No categories found.';
    return;
  }

  categoryList.replaceChildren();

  categories.forEach((category) => {
    const item = document.createElement('div');
    item.className = 'category-item';

    const image = document.createElement('img');
    image.className = 'category-image';
    image.alt = category.name;

    if (category.image_url) {
      try {
        const imageUrl = new URL(category.image_url);
        if (imageUrl.protocol === 'https:' || imageUrl.protocol === 'http:') {
          image.src = imageUrl.href;
        } else {
          throw new Error('Invalid image URL');
        }
      } catch {
        image.classList.add('category-placeholder');
        image.alt = 'No image available';
      }
    } else {
      image.classList.add('category-placeholder');
      image.alt = 'No image available';
    }

    const details = document.createElement('div');
    details.className = 'category-details';

    const name = document.createElement('strong');
    name.textContent = category.name;

    const gender = document.createElement('small');
    gender.textContent = `Category: ${category.gender}`;

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'primary-btn';
    editBtn.textContent = 'Edit';

    editBtn.addEventListener('click', () => {
      openEditCategory(category);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';

    deleteBtn.addEventListener('click', () => {
      deleteCategory(category);
    });

    details.append(name, gender);

    const actions = document.createElement('div');
    actions.className = 'category-actions';
    actions.append(editBtn, deleteBtn);

    item.append(image, details, actions);
    categoryList.appendChild(item);
    });

// Populate the product category dropdown
const productCategory = document.querySelector('#productCategory');

if (productCategory) {
  productCategory.replaceChildren();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select category';
  productCategory.appendChild(placeholder);

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;

    productCategory.appendChild(option);
  });
}

}

async function loadProducts() {
  productList.textContent = 'Loading products...';

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category_id,
      gender,
      description,
      price,
      compare_at_price,
      sizes,
      colors,
      image_url,
      images,
      stock,
      is_active,
      is_best_seller,
      created_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Product loading error:', error);
    productList.textContent = 'Unable to load products.';
    return;
  }

  productList.replaceChildren();

  if (!products || products.length === 0) {
    productList.textContent = 'No products have been added yet.';
    return;
  }

  products.forEach(product => {
    const item = document.createElement('div');
    item.className = 'category-item';

    const image = document.createElement('img');
    image.className = 'category-image';
    image.alt = product.name;

    if (product.image_url) {
      image.src = product.image_url;
    } else {
      image.alt = 'No product image';
    }

    const details = document.createElement('div');
    details.className = 'category-details';

    const name = document.createElement('h3');
    name.textContent = product.name;

    const price = document.createElement('p');
    price.textContent = `Price: KSh ${Number(product.price).toLocaleString()}`;

    const sizes = document.createElement('p');
    sizes.textContent = `Sizes: ${(product.sizes || []).join(', ') || 'Not specified'}`;

    const colors = document.createElement('p');
    colors.textContent = `Colours: ${(product.colors || []).join(', ') || 'Not specified'}`;

    const stock = document.createElement('p');
    stock.textContent = `Stock: ${product.stock}`;

    const status = document.createElement('p');
    status.textContent = product.is_active ? 'Active' : 'Inactive';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Edit Product';
    editButton.className = 'primary-btn';

    editButton.addEventListener('click', () => {
      startEditingProduct(product);
    });

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'primary-btn';
    toggleButton.textContent = product.is_active ? 'Deactivate' : 'Activate';

    toggleButton.addEventListener('click', async () => {
      toggleButton.disabled = true;

      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) {
        console.error('Product status update error:', error);
        alert('Unable to update product status: ' + error.message);
        toggleButton.disabled = false;
        return;
      }

      await loadProducts();
    });
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Delete Product';


        deleteButton.addEventListener('click', async () => {
          const confirmed = confirm(
            `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
          );

          if (!confirmed) return;

          deleteButton.disabled = true;
          deleteButton.textContent = 'Deleting...';

          try {
            // Delete the product record first.
            const { error: deleteError } = await supabase
              .from('products')
              .delete()
              .eq('id', product.id);

            if (deleteError) throw deleteError;

            // Remove all associated product images from Supabase Storage.
            const allImageUrls = [
              product.image_url,
              ...(Array.isArray(product.images) ? product.images : [])
            ].filter(Boolean);

            const imagePaths = [
              ...new Set(allImageUrls.map(getProductStoragePath).filter(Boolean))
            ];

            if (imagePaths.length > 0) {
              const { error: storageError } = await supabase.storage
                .from('category-images')
                .remove(imagePaths);

              if (storageError) {
                console.error('Image cleanup error:', storageError);

                alert(
                  'Product deleted, but some images could not be removed: ' +
                  storageError.message
                );
              }
            }

            await loadProducts();

          } catch (error) {
            console.error('Product deletion error:', error);
            alert('Unable to delete product: ' + error.message);

            deleteButton.disabled = false;
            deleteButton.textContent = 'Delete Product';
          }
        });


        details.append(
          name,
          price,
          sizes,
          colors,
          stock,
          status,
          editButton,
          toggleButton,
          deleteButton
        );
        item.append(image, details);

        productList.appendChild(item);
          });
    } 

// Sign out the administrator.
logoutBtn.addEventListener('click', async () => {
  logoutBtn.disabled = true;

  const { error } = await supabase.auth.signOut();

  if (error) {
    status.textContent = 'Could not sign out. Please try again.';
    logoutBtn.disabled = false;
    return;
  }

  window.location.replace('./login.html');
});

// Start the dashboard.
async function initialiseDashboard() {
  const isAdmin = await protectDashboard();

  if (isAdmin) {
    await loadCategories();
    await loadProducts();
  }
}



categoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  categoryFormMessage.textContent = '';

  const name = categoryName.value.trim();
  const gender = categoryGender.value;
  const imageFile = categoryImage.files[0];
  const sortOrder = Number(categoryOrder.value);

  if (!name) {
    categoryFormMessage.textContent = 'Please enter a category name.';
    return;
  }

  // Validate the selected image.
  if (imageFile) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(imageFile.type)) {
      categoryFormMessage.textContent =
        'Please select a JPG, PNG or WEBP image.';
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      categoryFormMessage.textContent =
        'Image size must not exceed 5 MB.';
      return;
    }
  }

  saveCategoryBtn.disabled = true;
  saveCategoryBtn.textContent = 'Saving...';

  try {
    const id = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const editingId = categoryForm.dataset.editingId;

    let imageUrl = null;

    // Upload an image only when a new file has been selected.
    if (imageFile) {
      saveCategoryBtn.textContent = 'Uploading image...';

      const extension = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      }[imageFile.type];

      const filePath = `${id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('category-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    let result;

    if (editingId) {
      const updateData = {
        name,
        gender,
        sort_order: sortOrder
      };

      // Preserve the old image unless a new one was selected.
      if (imageFile) {
        updateData.image_url = imageUrl;
      }

      result = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', editingId);

    } else {
      result = await supabase
        .from('categories')
        .insert({
          id,
          name,
          gender,
          image_url: imageUrl,
          sort_order: sortOrder
        });
    }

    if (result.error) throw result.error;

    categoryFormMessage.textContent = editingId
      ? 'Category updated successfully!'
      : 'Category created successfully!';

    categoryForm.reset();
    categoryOrder.value = 0;

    delete categoryForm.dataset.editingId;

    saveCategoryBtn.textContent = 'Save Category';

    categoryForm.hidden = true;
    showCategoryForm.hidden = false;

    await loadCategories();

  } catch (error) {
    console.error('Category save error:', error);

    categoryFormMessage.textContent =
      error.message || 'Unable to save category.';

  } finally {
    saveCategoryBtn.disabled = false;
    saveCategoryBtn.textContent = 'Save Category';
  }
});



function openEditCategory(category) {
  categoryForm.hidden = false;
  showCategoryForm.hidden = true;

  categoryName.value = category.name;
  categoryGender.value = category.gender;

  // File inputs cannot be prefilled with an existing image.
  categoryImage.value = '';

  categoryOrder.value = category.sort_order;

  categoryFormMessage.textContent =
    'Editing: ' + category.name;

  saveCategoryBtn.textContent = 'Update Category';

  // Preserve the ID so the submit handler updates this category.
  categoryForm.dataset.editingId = category.id;

  categoryName.focus();
}


async function deleteCategory(category) {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${category.name}"?`
  );

  if (!confirmed) return;

  try {
    // Check whether products use this category.
    const { count, error: checkError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id);

    if (checkError) throw checkError;

    if (count > 0) {
      window.alert(
        `Cannot delete "${category.name}" because ${count} product(s) are assigned to it.`
      );
      return;
    }

    // Delete the category only if no products use it.
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id);

    if (error) throw error;

    window.alert('Category deleted successfully!');

    await loadCategories();

  } catch (error) {
    window.alert(`Unable to delete category: ${error.message}`);
  }
}

function startEditingProduct(product) {
  editingProductId = product.id;
  editingProductImageUrl = product.image_url;

  editingProductImages = Array.isArray(product.images)
    ? [...product.images]
    : (product.image_url ? [product.image_url] : []);

  // Open the product form
  productForm.hidden = false;
  showProductForm.hidden = true;

  // Fill in basic product details
  productName.value = product.name;
  productCategory.value = product.category_id;
  productGender.value = product.gender;
  productDescription.value = product.description || '';
  productPrice.value = product.price;
  productStock.value = product.stock ?? 0;
  productComparePrice.value = product.compare_at_price ?? '';
  productColors.value = (product.colors || []).join(', ');

  // Set checkboxes
  productBestSeller.checked = product.is_best_seller;
  productActive.checked = product.is_active;

  // Determine product size type
  const sizes = product.sizes || [];

  if (sizes.includes('One size')) {
    productType.value = 'one-size';

  } else if (sizes.some(size => /^\d{2}[A-J]{1,2}$/.test(size))) {
    productType.value = 'bra';

    const bands = [...new Set(
      sizes.map(size => size.match(/^(\d{2})/)[1])
    )];

    const cups = [...new Set(
      sizes.map(size => size.match(/^\d{2}([A-J]{1,2})$/)[1])
    )];

    Array.from(productBandSizes.options).forEach(option => {
      option.selected = bands.includes(option.value);
    });

    Array.from(productCupSizes.options).forEach(option => {
      option.selected = cups.includes(option.value);
    });

  } else {
    productType.value = 'clothing';

    Array.from(productClothingSizes.options).forEach(option => {
      option.selected = sizes.includes(option.value);
    });
  }

  updateSizeFields();

  // Clear the image input; existing image will be retained unless replaced
  productImage.value = '';

  // Update form appearance
  saveProductBtn.textContent = 'Update Product';
  productFormMessage.textContent = 'Editing: ' + product.name;

  // Scroll to the form
  productForm.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}
productForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  productFormMessage.textContent = '';

  const name = productName.value.trim();
  const categoryId = productCategory.value;
  const gender = productGender.value;
  const description = productDescription.value.trim();
  const price = Number(productPrice.value);
  const stock = Number(productStock.value);
  const comparePrice = productComparePrice.value === ''
    ? null
    : Number(productComparePrice.value);

  const imageFiles = Array.from(productImage.files);
  const type = productType.value;

  // Validate product details.
  if (!name || !categoryId || !Number.isFinite(price) || price < 0) {
    productFormMessage.textContent =
      'Please enter a valid name, category and price.';
    return;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    productFormMessage.textContent =
      'Stock must be a whole number of zero or more.';
    return;
  }

  // Validate image.
// Validate all selected product images.
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  for (const imageFile of imageFiles) {
    if (!allowedTypes.includes(imageFile.type)) {
      productFormMessage.textContent =
        'Please select only JPG, PNG or WEBP images.';
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      productFormMessage.textContent =
        'Each image must not exceed 5 MB.';
      return;
    }
  }
  // Collect available sizes.
  let sizes = [];

  if (type === 'bra') {
    const bands = Array.from(
      productBandSizes.selectedOptions,
      option => option.value
    );

    const cups = Array.from(
      productCupSizes.selectedOptions,
      option => option.value
    );

    sizes = bands.flatMap(band =>
      cups.map(cup => `${band}${cup}`)
    );

  } else if (type === 'clothing') {
    sizes = Array.from(
      productClothingSizes.selectedOptions,
      option => option.value
    );

  } else if (type === 'one-size') {
    sizes = ['One size'];
  }

  if (sizes.length === 0) {
    productFormMessage.textContent =
      'Please select at least one product size.';
    return;
  }

  const colors = productColors.value
    .split(',')
    .map(color => color.trim())
    .filter(Boolean);

  if (colors.length === 0) {
    productFormMessage.textContent =
      'Please enter at least one colour.';
    return;
  }

  if (
    comparePrice !== null &&
    (!Number.isFinite(comparePrice) || comparePrice < 0)
  ) {
    productFormMessage.textContent =
      'Please enter a valid compare-at price.';
    return;
  }

  saveProductBtn.disabled = true;
  saveProductBtn.textContent = 'Saving Product...';

  try {
    // Generate a unique product slug.
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + crypto.randomUUID().slice(0, 8);

        let imageUrl = editingProductId
          ? editingProductImageUrl
          : null;

        let imageUrls = editingProductId
          ? [...editingProductImages]
          : [];

        // Keep the main image in the gallery, including for older products.
        if (imageUrl && !imageUrls.includes(imageUrl)) {
          imageUrls.unshift(imageUrl);
        }

        // Upload all newly selected product images.
        if (imageFiles.length > 0) {
          imageUrls = imageUrls.filter(Boolean);

          for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i];

            saveProductBtn.textContent =
              `Uploading image ${i + 1} of ${imageFiles.length}...`;

            const extension = {
              'image/jpeg': 'jpg',
              'image/png': 'png',
              'image/webp': 'webp'
            }[imageFile.type];

            const filePath =
              `products/${slug}/${crypto.randomUUID()}.${extension}`;

            const { error: uploadError } = await supabase.storage
              .from('category-images')
              .upload(filePath, imageFile, {
                cacheControl: '3600',
                upsert: false,
                contentType: imageFile.type
              });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
              .from('category-images')
              .getPublicUrl(filePath);

            const uploadedUrl = publicUrlData.publicUrl;

            imageUrls.push(uploadedUrl);

            // The first image becomes the main image if one doesn't exist.
            if (!imageUrl) {
              imageUrl = uploadedUrl;
            }
          }
        }   
    // Save product information.
    saveProductBtn.textContent = 'Saving Product Details...';

    const productData = {
      name,
      category_id: categoryId,
      gender,
      description,
      price,
      compare_at_price: comparePrice,
      sizes,
      colors,
      image_url: imageUrl,
      images: imageUrls,
      stock,
      is_active: productActive.checked,
      is_best_seller: productBestSeller.checked
    };

    let saveError;

    if (editingProductId) {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProductId);

      saveError = error;

    } else {
      // Create new product
      const { error } = await supabase
        .from('products')
        .insert({
          ...productData,
          slug
        });

      saveError = error;
    }

    if (saveError) throw saveError;

    productFormMessage.textContent = editingProductId
      ? 'Product updated successfully!'
      : 'Product created successfully!';

    await loadProducts();

    productForm.reset();
    productActive.checked = true;

    editingProductId = null;
    editingProductImageUrl = null;
    editingProductImages = [];

    saveProductBtn.textContent = 'Save Product';

    updateSizeFields();

  } catch (error) {
    console.error('Product creation error:', error);

    productFormMessage.textContent =
      error.message || 'Unable to create product.';

  } finally {
    saveProductBtn.disabled = false;
    saveProductBtn.textContent = 'Save Product';
  }
});

initialiseDashboard();
