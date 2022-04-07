const loadFile = (generateFormCallback) => {
  const fileToLoad = document.getElementById("fileToLoad").files[0];

  const fileReader = new FileReader();

  fileReader.onload = function(fileLoadedEvent){
    const textFromFileLoaded = fileLoadedEvent.target.result;
    generateFormCallback(textFromFileLoaded)
  };

  fileReader.readAsText(fileToLoad, "UTF-8");
}

const generateForm = (text) => {
  const orderForm = document.querySelector('#orderForm')
  const xmlString = text;
  const parser = new DOMParser();
  const dom = parser.parseFromString(xmlString,"text/xml");
  const root = dom.getElementsByTagName('order')[0];

  let formValues = {};

  const traverse = (node, renderNode) => {
    if (node.childNodes && node.childNodes.length > 0) {
      node.childNodes.forEach((childNode) => traverse(childNode, renderNode));
    }
    renderNode(node);
  }

  const renderNode = (node) => {
    if (node.attributes) {
      const { nodeName } = node;
      const { title, type, required, options, multiple, disabled, tax_rate, cost } = node.attributes;
      let elements;

      if (type && type.value.toLowerCase() === 'text') {
        let format;

        if (title.value === 'Email Address') {
          format = '^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$';
        } else if (title.value === 'Phone Number') {
          format = '[0-9]{3}[\\-\\)][0-9]{3}-[0-9]{4}';
        } else if (title.value === 'Postal Code') {
          format = '[0-9a-zA-Z]{3} [0-9a-zA-Z]{3}';
        }

        elements = createTextInput(
          nodeName,
          title.value,
          required && required.value,
          disabled && disabled.value,
          format,
        );
      } else if (type && type.value.toLowerCase() === 'select') {
        elements = createSelectInput(
          nodeName,
          title.value,
          options.value,
          required && required.value,
          disabled && disabled.value,
          multiple && multiple.value,
        );
      } else if (type && type.value.toLowerCase() === 'radio') {
        elements = createRadioInput(
          nodeName,
          title.value,
          options.value,
          required && required.value,
          disabled && disabled.value,
        );
        elements = [...elements, document.createElement('br')]
      }

      if (multiple && multiple.value === 'true') {
        if (type.value.toLowerCase() === 'select') {
          elements.push(
            createAddButton(
                nodeName,
                () => createSelectInput(
                  nodeName,
                  title.value,
                  options.value,
                  required && required.value,
                  disabled && disabled.value,
                  multiple && multiple.value,
                )
            ),
          );
        }
      }

      if (tax_rate) {
        formValues.taxRate = Number(tax_rate.value.slice(0,-1)) / 100
      }

      if (cost) {
        formValues.expeditedShippingCost = +cost.value;
      }

      if (elements) {
        renderFields(elements)
      }
    }
  }

  const computeItemTotal = () => {
    const { item } = formValues;
    let total = item ? item.reduce((prev, current) => {
      prev += +Object.values(current)[0];
      return prev;
    }, 0) : 0;

    return total;
  }

  const computeTax = (total) => {
    return total * formValues.taxRate;
  }

  const computeFinalTotal = (total, tax) => {
    if (formValues['expedited'] === 'Yes') {
      total += formValues.expeditedShippingCost;
    }

    return total + tax;
  }

  const renderFields = (elements) => {
    orderForm.append(...elements);
  }

  const createInputLabel = (nodeName, label) => {
    const textInputLabel = document.createElement('label');
    textInputLabel.htmlFor = nodeName;
    textInputLabel.innerHTML = label;
    textInputLabel.className = 'label'
    return textInputLabel;
  }

  const createRadioInput = (nodeName, label, options, required, disabled) => {
    return [
      createInputLabel(nodeName, label),
      ...options.split(',').reduce((list, option) => {
        const radioInputLabel = createInputLabel(option, option);
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = label;
        radioInput.id = option;
        radioInput.value = option;
        radioInput.className = `${label}`;
        radioInput.disabled = disabled === 'true';
        radioInput.required = required === 'true';
        radioInput.onchange = (e) => {
          const { value } = e.target;
          formValues[nodeName] = value;

          const itemTotal = computeItemTotal();

          const tax = computeTax(itemTotal);
          const finalTotal = computeFinalTotal(itemTotal, tax);

          const taxInput = document.getElementById('tax');
          const totalInput = document.getElementById('final_price');

          taxInput.value = tax;
          totalInput.value = finalTotal;

          formValues.tax = tax;
          formValues.itemTotal = itemTotal;
          formValues.finalTotal = finalTotal;
        }
        list.push(radioInput, radioInputLabel);
        return list;
      }, [])
    ];
  }

  const createTextInput = (nodeName, label, required, disabled, format) => {
    const textInputLabel = createInputLabel(nodeName, label);
    const textInput = document.createElement('input');
    textInput.id = nodeName
    textInput.type = 'text';
    textInput.placeholder = label;
    textInput.className = `${label} field`;
    textInput.required = required === 'true';
    textInput.disabled = disabled === 'true';
    if (format) {
      textInput.pattern = format;
    }
    textInput.onchange = (e) => {
      const { value } = e.target;
      formValues[nodeName] = value;
    }
    return [textInputLabel, textInput];
  }

  const createSelectInput = (nodeName, label, options, required, disabled, multiple) => {
    const selectInputLabel = createInputLabel(nodeName, label);
    const createOption = (option) => {
      const optionElement = document.createElement('option');
      if (option.includes('|')) {
        const [display, value] = option.split('|');
        optionElement.value = value;
        optionElement.innerHTML = display;
      } else {
        optionElement.value = option;
        optionElement.innerHTML = option;
      }
      return optionElement;
    };

    const optionElements = ['', ...options.split(',')].map((option) => createOption(option.trim()));
    const selectInput = document.createElement('select');
    selectInput.id = `${nodeName}-1`
    selectInput.className = `${nodeName} field`;
    selectInput.append(...optionElements);
    selectInput.required = required === 'true';
    selectInput.disabled = disabled === 'true';
    selectInput.onchange = (e) => {
      const { value } = e.target;
      if (multiple === 'true') {
        if (!formValues[nodeName]) {
          formValues[nodeName] = [];
        }

        const index = formValues[nodeName].findIndex((formValue) => e.target.id in formValue);

        if (index > -1) {
          formValues[nodeName][index] = {[e.target.id]: value};
        } else {
          formValues[nodeName].push({[e.target.id]: value});
        }
      } else {
        formValues[nodeName] = value;
      }

      if (nodeName === 'item') {
        const itemTotal = computeItemTotal();

        const tax = computeTax(itemTotal);
        const finalTotal = computeFinalTotal(itemTotal, tax);

        const taxInput = document.getElementById('tax');
        const totalInput = document.getElementById('final_price');

        taxInput.value = tax;
        totalInput.value = finalTotal;

        formValues.tax = tax;
        formValues.itemTotal = itemTotal;
        formValues.finalTotal = finalTotal;
      }
    }

    return [selectInputLabel, selectInput];
  }

  const createAddButton = (nodeName, elementCreator) => {
    const appendDuplicateElement = () => {
      const elements = document.querySelectorAll(`.${nodeName}`);
      const lastElement = elements[elements.length-1]
      const { id } = lastElement;
      const [,series] = id.split('-');
      const newElement = elementCreator()[1];

      if (series) {
        newElement.id = `${nodeName}-${+series+1}`;
      } else {
        newElement.id = `${nodeName}-2`
      }

      lastElement.insertAdjacentElement('afterend', newElement);
    }

    const addButton = document.createElement('button');
    addButton.id = `${nodeName}AddButton`
    addButton.type = 'button';
    addButton.innerHTML = '+ Add';
    addButton.className = `field`;
    addButton.onclick = () => appendDuplicateElement();
    addButton.onchange = (e) => {
      const { value } = e.target;
      if (!formValues[nodeName]) {
        formValues[nodeName] = [];
      }

      const index = formValues[nodeName].findIndex((formValue) => e.target.id in formValue);

      if (index > -1) {
        formValues[nodeName][index] = {[e.target.id]: value};
      } else {
        formValues[nodeName].push({[e.target.id]: value});
      }
    }

    return addButton;
  }

  traverse(root, renderNode);

  const submitButton = document.createElement('button');
  submitButton.innerHTML = 'Submit';
  submitButton.type = 'submit';

  orderForm.onsubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('formValues', JSON.stringify(formValues));
    orderForm.reset();
    document.getElementById("fileToLoad").value = '';
    window.location.href = 'confirmation.html'
  }

  orderForm.append(submitButton);

};
