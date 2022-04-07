(() => {
  const customerInfo = document.querySelector('#customerInfo');
  const orderDetails = document.querySelector('#orderDetails');
  const formValues = JSON.parse(localStorage.getItem('formValues'));

  const customerInfoH2 = document.createElement('h2');
  const fullNameP = document.createElement('p');
  const emailP = document.createElement('p');
  const phoneNumberP = document.createElement('p');
  const streetAddressP = document.createElement('p');
  const cityP = document.createElement('p');
  const provinceP = document.createElement('p');
  const postalCodeP = document.createElement('p');

  customerInfoH2.innerHTML = 'Customer Info'
  fullNameP.innerHTML = `Full Name: ${formValues['name']}`;
  emailP.innerHTML = `Email Address: ${formValues['email']}`;
  phoneNumberP.innerHTML = `Phone Number: ${formValues['phone_number']}`;
  streetAddressP.innerHTML = `Street Address: ${formValues['street_address']}`;
  cityP.innerHTML = `City: ${formValues['city']}`;
  provinceP.innerHTML = `Province: ${formValues['province']}`;
  postalCodeP.innerHTML = `Postal Code: ${formValues['postal_code']}`

  customerInfo.append(customerInfoH2, fullNameP, emailP, phoneNumberP, streetAddressP, cityP, provinceP, postalCodeP);

  const orderDetailsH2 = document.createElement('h2');
  const expeditedP = document.createElement('p');
  const expeditedCostP = document.createElement('p');
  const items = formValues.item.reduce((items, currentItem) => {
    const [,value] = Object.entries(currentItem)[0];
    let existingItem = items.find((item) => item.name === `item-${value}`);
    if (!existingItem) {
      existingItem = { name: `item-${value}`, price: +value, qty: 0 };
      items.push(existingItem);
    }
    existingItem.qty++;
    return items;
  }, []);
  const itemTable = document.createElement('table');
  const itemHeader = document.createElement('tr');
  const itemHeaderName = document.createElement('th')
  const itemHeaderPrice = document.createElement('th')
  const itemHeaderQty = document.createElement('th')
  const itemHeaderTotal = document.createElement('th')
  const itemsTrs = items.map((item) => {
    const itemTr = document.createElement('tr');
    const nameTd = document.createElement('td');
    const priceTd = document.createElement('td');
    const qtyTd = document.createElement('td');
    const totalTd = document.createElement('td');

    nameTd.innerHTML = item.name;
    priceTd.innerHTML = item.price;
    qtyTd.innerHTML = item.qty;
    totalTd.innerHTML = +item.price * +item.qty;

    itemTr.append(nameTd, priceTd, qtyTd, totalTd);

    return itemTr;
  });
  itemHeaderName.innerHTML = 'Name';
  itemHeaderPrice.innerHTML = 'Price';
  itemHeaderQty.innerHTML = 'Quantity';
  itemHeaderTotal.innerHTML = 'Total'
  itemHeader.append(itemHeaderName, itemHeaderPrice, itemHeaderQty, itemHeaderTotal);
  itemTable.append(itemHeader, ...itemsTrs)
  const itemTotalP = document.createElement('p');
  const taxP = document.createElement('p');
  const finalTotalP = document.createElement('p');

  orderDetailsH2.innerHTML = 'Order Details'
  expeditedP.innerHTML = `Expedited Shipping: ${formValues['expedited']}`;
  itemTotalP.innerHTML = `Item Total: ${formValues['itemTotal']}`;
  if (formValues.expedited === 'Yes') {
    expeditedCostP.innerHTML = `Expedited Fee: ${formValues.expeditedShippingCost}`;
  } else {
    expeditedCostP.innerHTML = 'Expedited Fee: n/a';
  }
  taxP.innerHTML = `Tax (${formValues['taxRate'] * 100}%): ${formValues['tax']}`;
  finalTotalP.innerHTML = `Total: ${formValues['finalTotal']}`;

  customerInfo.append(orderDetailsH2, expeditedP, itemTable, itemTotalP, expeditedCostP, taxP, finalTotalP);
})()