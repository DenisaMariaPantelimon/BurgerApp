//////////////////
// Callback hell method -> then chain
//////////////////
"use strict";

document.addEventListener('DOMContentLoaded', () => {
    // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    fetch('./pages.json')
        .then(response => response.json())
        .then(data => onDataLoad(data))
        .catch(e => console.error(e));
});

let mainPage;
let basketList = [];
let navButtons = [];
let innerHtmlBasket = '';

// ------------------------------------- Display UI functions ------------------------------------------
function onDataLoad(data) {
    mainPage = data.MainPage;

    refreshPageUI(data.MainPage);

    // Set content for main-container when the page is initialized  
    refreshMainPageUi(data.MainPage.Buttons[0].Page);

    // Create Basket List 
    CreateBasketListWithString();
}

function refreshPageUI(page) {
    // 1. Update Page Title:
    document.getElementById('page-header').innerHTML = page.Title;

    // 2. Refresh Buttons List:
    const buttonDiv = document.createElement('li');
    document.getElementById('page-header').appendChild(buttonDiv);

    let navButtons = '';
    page.Buttons.forEach(element => {
        navButtons += `<li class="button" onclick="onNavigationButtonClick('${element.Link}')">
                        <img src="./items/${element.Picture}" class="circular-square">
                        <p> ${element.Caption}</p>
                   </li>`
    });
    document.getElementById('buttons-container').innerHTML = navButtons;
}

function refreshMainPageUi(page) {
    // 1. Update Page Title:
    document.getElementById('main-page-header').innerHTML = page.Title;

    // 2. Refresh Buttons List:
    const buttonDiv = document.createElement('li');
    document.getElementById('main-container').appendChild(buttonDiv);

    navButtons = []; // To process data
    let innerHtmlBtns = ''; // To display items 

    page.Buttons.forEach(element => {
        let navButtonsEl = ` <li class = "button">
            <img src ="./items/${element.Picture}" class="circular-square" >
            <p> ${element.Caption } </p> 
            <p id = "price-label"> ${convertPrice(element.Price)} </p> 
            <button type="button"  onclick="onOrderButtonClick('${element.Link}')" class="button-order"> Add to order </button> </li>`

        navButtons.push(element);
        innerHtmlBtns += navButtonsEl;
    });

    document.getElementById('main-container').innerHTML = innerHtmlBtns;
}

function onNavigationButtonClick(link) {
    const btnClicked = mainPage.Buttons.find(x => x.Link === link);
    refreshMainPageUi(btnClicked.Page);
}

function onOrderButtonClick(link) {
    let localItem = navButtons.find(x => x.Link === link);

    if (isItemInBasket(localItem)) {
        increaseItemQty(link);
        // increaseItemQty(localItem);
    } else {
        addItemToBasket(localItem);
    }

    refreshBasketPageUI();
}

// Ce am facut aici?! 
function refreshBasketPageUI() {
    innerHtmlBasket = '';
    innerHtmlBasket += CreateBasketListWithString();

    // INTREBARE: Daca fac onclick cu parametrul 'element' trimite tipul obiectului, nu obiectul in sine, care e logica din spate?
    basketList.forEach(element => {
        let orderItem = ` <li > <p>${element.Caption}  ${element.Qty} </p> <button type="button" class="order-button" onclick="increaseItemQty('${element.Link}')"> Increase Qty </button> <button type="button" class="order-button" onclick="decreaseItemQty('${element.Link}')"> Decrease Qty </button> </li>`
        innerHtmlBasket += orderItem;
    });

    // Display total - Asta e de tip obiect si tu incerci sa il convertesti la string !!!!
    // let orderTotal = document.createElement('h3');
    // orderTotal.textContent = 'Total to pay: ' + convertPrice(getBasketTotal());
    // document.getElementById('basket-container').appendChild(orderTotal);

    let orderTotal = ` <p5><b> Total to pay: ${convertPrice(getBasketTotal())} <b></p5>`;
    innerHtmlBasket += orderTotal;

    document.getElementById('basket-container').innerHTML = innerHtmlBasket;
}

function CreateBasketListWithString() {
    let basketListContent = '';

    let buttonOrder = `<li> <button onclick=proceedToPayment()> Proceed to payment </button> </li>`; // !! Atentie unde nu e nevoie de intepolare 
    basketListContent += buttonOrder;

    let buttonCancel = `<li> <button onclick=emptyBasketList()> Cancel order </button> </li>`;
    basketListContent += buttonCancel;

    let titleItem = ` <li> <p> Your order: </p> </li>`;
    basketListContent += titleItem;

    document.getElementById('basket-container').innerHTML = basketListContent;
    // asta ca sa initializez continutul la prima incarcare a paginii

    return basketListContent;
    // return contentul ca sa-l alipeasca la lista cu produse pentru restul cazurilor
}

function proceedToPayment() {
    console.log('proceedToPayment clicked.');
    window.open("index2.html");
}

// -----------------------------------------  Order computational operations ------------------------

function convertPrice(price) {
    if (price > 0) {
        return `$ ${(price/100.0).toFixed(2)}`;
    }

    return `$ ${(0/100.0).toFixed(2)}`;
}

function isItemInBasket(item) {
    // let isItemInOrder = basketList.find(x => x.ID === item.ID);
    // return (isItemInOrder !== undefined);

    let isItemInOrder = false;
    basketList.forEach(element => {
        if (element.Link === item.Link) {
            isItemInOrder = true;
        }
    });
    return isItemInOrder;
}

function increaseItemQty(Link) {
    let localItem = basketList.find(x => x.Link == Link);

    if (localItem !== "undefined") {
        localItem.Qty++;

        basketList = basketList.filter(x => x.Link !== Link); // remove item from basket and add with new qty
        basketList.push(localItem);

        refreshBasketPageUI();
    }
}

function decreaseItemQty(Link) {
    let localItem = basketList.find(x => x.Link == Link);

    if (localItem !== "undefined") {
        localItem.Qty--;

        basketList = basketList.filter(x => x.Link !== Link);

        // only add if qty is higher than 0 
        if (localItem.Qty > 0) {
            basketList.push(localItem);
        }

        refreshBasketPageUI();
    }
}

function addItemToBasket(item) {
    item.Qty = 1;
    basketList.push(item);
}

function emptyBasketList() {
    // basketList.forEach(element => basketList.pop()); NU ASA
    basketList = [];

    refreshBasketPageUI();
    //  TREBUIE SA ACTUALIZEZI SI UI - ul
}

function getBasketTotal() {
    let itemPrices = [];
    let basketTotal = 0; // Prevent error for empty basket
    let reducer = (accumulator, currentValue) => accumulator + (currentValue ? currentValue : 0); // pt ca unele preturi sunt NaN

    // nu m-am descurcat sa parsez direct BasketList cu reducer, asa ca am facut auxiliarul asta
    if (basketList.length > 0) {
        basketList.forEach(element => {
            itemPrices.push(parseInt(element.Price * element.Qty));
        });
        basketTotal = itemPrices.reduce(reducer);
    }

    console.log('Basket total ', basketTotal);
    return basketTotal;
}

function gitTest() {
    return 'GitTest';
}