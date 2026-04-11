// réaliser un scrape de vinted pour récupérrer les ventes en live 
// plus utiliser a cause de la protection anti-bot de vinted
import * as cheerio from 'cheerio';
import { v5 as uuidv5 } from 'uuid';

const COOKIE ="_lm_id=6TXXLQOVK1XFACZB; __ps_r=_; __ps_lu=https://www.vinted.fr/; __ps_did=pscrb_d96705f6-7096-4ab6-efae-3a18f965a39d; __ps_fva=1763923755325; v_udt=TUxOYTBWMGhNL3R3ZE1JMnlUeUZuQnBwcVZpNy0tRUhBcFp0K2h4VXN3WUhDNC0tbGdXNlBOeXFNYktMQmlFNG4yYldMdz09; anonymous-locale=fr; non_dot_com_www_domain_cookie_buster=1; domain_selected=true; OptanonAlertBoxClosed=2026-03-23T17:01:50.468Z; eupubconsent-v2=CQhhIxgQhhIxgAcABBFRCXFgAAAAAEPgAAwIAAAWZABMNCogjLIgACBQEAIEACgrCACgQBAAAkDRAQAmDAhyBgAusJkAIAUAAwQAgABBgACAAASABCIAIACAQAgQCBQABgAQBAQAMDAAGACxEAgABAdAxTAggECwASIyqDTAlAASCAlsqEEgCBBXCFIscAggREwUAAAIABQAAAD4WAhJKCViQQBcQXQAAEAAAUQIECKQswBBQGaLQVgScBkaYBk-YJklOgyAJghIyDIhNUEg8UxRAAAA.YAAACHwAAAAA.ILNtR_G__bXlv-Tb36bpkeYxf99hr7sQxBgbJs24FzLvW7JwC32E7NEzatqYKmRIAu3TBIQNtHIjURUChKIgVrzDsaEyUoTtKJ-BkiDMRY2JYCFxvm4pjWQCZ4vr_51d9mT-N7dr-2dzyy5hnv3a9fuS1UJicKYetHfn8ZBKT-_IU9_x-_4v4_MbpEm-eS1v_tGtt43d64tP_dpuxt-Tyffz___f72_e7X__c__33_-qXX_77_4A; OTAdditionalConsentString=1~; anon_id=df40df9a-0676-4515-b4ec-09e29e8215b7; v_uid=25524132; is_shipping_fees_applied_info_banner_dismissed=false; anonymous-iso-locale=fr-FR; consent_version=eu; v_sid=f61b5e31-1775813718; user-locale=fr; user-iso-locale=fr-FR; ab.optOut=This-cookie-will-expire-in-2027; refresh_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhY2NvdW50X2lkIjoxMTM2NzAyOCwiYXBwX2lkIjo0LCJhdWQiOiJmci5jb3JlLmFwaSIsImNsaWVudF9pZCI6IndlYiIsImV4cCI6MTc3NjUxMTQ1MCwiaWF0IjoxNzc1OTA2NjUwLCJpc3MiOiJ2aW50ZWQtaWFtLXNlcnZpY2UiLCJwdXJwb3NlIjoicmVmcmVzaCIsInNjb3BlIjoidXNlciIsInNpZCI6ImY2MWI1ZTMxLTE3NzU4MTM3MTgiLCJzdWIiOiIyNTUyNDEzMiIsImNjIjoiRlIiLCJhbmlkIjoiZGY0MGRmOWEtMDY3Ni00NTE1LWI0ZWMtMDllMjllODIxNWI3IiwiYWN0Ijp7InN1YiI6IjI1NTI0MTMyIn19.DigxpFbm_lZK9rFL0LCOuYVlqu2i3-mUId6quIZUEas5MecjkiVbhPhbz7FAUUxterJPzr67RqJLVe9xU-wxb0y06frErH9ai8Ppu1Y6nBml-3JQd2b03NaKA1pWeJEzWlppZNB_Q7RAOHNlkoQtv7hK3BUsEarYJBwSwYdhUvQKGZWLasRH4o0JPzOg1elWnpMp4heTP2kIt4VvOCwkZXwCQ7JU00YX2uPYQQyICTpSlzV9BQ4l26owLL7WjWgiexStilkqntZq82MnmbSx94YJ3PzADzKjvwlzml7vz7CHxvSyFN9jepKRqgcyCqqTQeBnUnRHIG-Yv7hT-Tyleg; access_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhY2NvdW50X2lkIjoxMTM2NzAyOCwiYXBwX2lkIjo0LCJhdWQiOiJmci5jb3JlLmFwaSIsImNsaWVudF9pZCI6IndlYiIsImV4cCI6MTc3NTkxMzg1MCwiaWF0IjoxNzc1OTA2NjUwLCJpc3MiOiJ2aW50ZWQtaWFtLXNlcnZpY2UiLCJwdXJwb3NlIjoiYWNjZXNzIiwic2NvcGUiOiJ1c2VyIiwic2lkIjoiZjYxYjVlMzEtMTc3NTgxMzcxOCIsInN1YiI6IjI1NTI0MTMyIiwiY2MiOiJGUiIsImFuaWQiOiJkZjQwZGY5YS0wNjc2LTQ1MTUtYjRlYy0wOWUyOWU4MjE1YjciLCJhY3QiOnsic3ViIjoiMjU1MjQxMzIifX0.xPLiUz3neq4YtBEH14cgQjMSR7fiigPCnMIln80iCYMLJs0ZhSonxvcm2rEbnnOI3dPcUWgC0t2fmI5o1DCV0zboBZwtB-3NXXXZnBkKeF6alXzuP1U0wpVCSg7NM00VCdAHnL8B6HSCa5hbm-kDOpjCtFi4l-nBf1X41LP0Pf9TluA9ehSb-0WaFOHJYI4s-N6ZGAv8-jG33mARa8JByx7l1e3cR5fj97RVEb2SwjAHyA2Cev7loLJkz9zHJ0tqDzSs5DRC-wwnt5E4C7l_5Fe0aMgVi4ZSEh-qvDMZuTWsEp-kMO4ivxPzgwFPZb7E6pQrkPvsUJeiVEEI0uK0CA; ad_blocker_detected=true; viewport_size=465; cf_clearance=rhnsSXNBifzexEKxmfXk56fatqQUh2mOFZ1b62AX9Cw-1775910884-1.2.1.1-OZ6RxQU4X63qqILvsP4vt99YoixLrlaha2ZTgBEFUNF5OhBnUKd.lhoQNInuXhCwPZYTZVjFBuQPxL3FLm9wY7I5qAke2I7hjJFp_0icYxJKd5aQGu9SYOS7FGkdFaSV0hv2yCey9iyU0gnvdLK2Ncs5BrY0I2Dv27fPrFOVTJhlmoUu7f20qcQFFaceUEFlT5QnvQq4gsr63y.La4DOYprV51Muv4DZ7TPgdkPe4oHJi4TTdcWywNIB7CHIXWh3VULeyvslS9gpIuidZ8jcK8aLUi.S9tkK1z04ncFiiYU_YorYaXxERswjZvah907l6Sicte1tEa9sXO6mg.wwAw; __cf_bm=DXjsJL754dzvFB6HMVQqTyedJUe4d8m9.KSvOyV9TX4-1775910884.3728697-1.0.1.1-zdr84RKkVnep4.WmzQbrT18rOUn.FxJ7cfcow4tq31q2nPNDvcX9R_16QpH4xlwCQNsy.C77gjExrAJq23wSyz6khwYhWvyt2XqejJcS.5jjAEdgVl3lojPKIJ5VCguOUYNc7aZXPSqwcfCxDvIrKw; banners_ui_state=SUCCESS; datadome=ODbQHqnclJSb8EBL0ncEOpschaaNI_v_WoivyoQShxcsS~sZQltBWImoR263~r0eqIdEE4uG5681cxjxu6UePca9444nBG7xsZ7Fs1B4wbuewpGtmN_KczqEUrLS3ZVe; OptanonConsent=isGpcEnabled=0&datestamp=Sat+Apr+11+2026+14%3A35%3A01+GMT%2B0200+(heure+d%E2%80%99%C3%A9t%C3%A9+d%E2%80%99Europe+centrale)&version=202602.1.0&browserGpcFlag=0&isIABGlobal=false&consentId=25524132&isAnonUser=1&hosts=&interactionCount=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A0%2CC0003%3A0%2CC0004%3A0%2CC0005%3A0%2CV2STACK42%3A0%2CC0035%3A0%2CC0038%3A0&genVendors=V2%3A0%2CV1%3A0%2C&intType=2&geolocation=FR%3BIDF&AwaitingReconsent=false&prevHadToken=0; _vinted_fr_session=OW0vYmp3SEtuaDZTbzVGK2U4VHkvVHFHNlJjaFZkQzJzMDRJRk14cjArSEM3Zkh1UVUwK241d1picURFNCtvdEs0cURFVGdyMHlsWjVDYjVVRG5DRGc3b3JQRU95ZytmYlNhTzFtdDZncDRRU0xzemVHUTdYV2NScGRIUnpaSSt3VlA5MDhrWWVya1Vnd1dzSkJoUHQ3eHFmdVFwRUlySEtCT3pnQlV6cldJMHc0VzhPS3V4U04wKzZHa0xzcW04aXRHQm1qWS9LTGIyYnM2Nk1EclRHbFlPS3FQNnRlMnpIZ1I0d0p2NFEvWWFycDV4anRpV0JjNXQwVEdqNzBPUi0tdWFtbEU1RGhoRTFTa2NrbEFuUnp0UT09--d6052eb8959708cc3eec5634e094c381d3e24405";
function isNotDefined(value) {
  return (value == null || (typeof value === "string" && value.trim().length === 0));
}

/**
 * Parse  
 * @param  {String} data - json response
 * @return {Object} sales
 */
const parse = data => {
  try {
    const {items} = data;

    return items.map(item => {
      const link = item.url;
      // Handle price as object {amount, currency_code} or as number
      let price = item.total_item_price;
      let currency = 'EUR';
      if (typeof price === 'object' && price !== null) {
        currency = price.currency_code || 'EUR';
        price = parseFloat(price.amount) || price.amount;
      } else {
        price = parseFloat(price) || price;
      }
      
      const {photo} = item;
      const published = photo && photo.high_resolution && photo.high_resolution.timestamp ? photo.high_resolution.timestamp : item.created_at || new Date().toISOString();

      return {
        link,
        price,
        currency,
        title: item.title,
        published,
        'uuid': uuidv5(link, uuidv5.URL)
      }
    })
  } catch (error){
    console.error('Parse error:', error);
    return [];
  }
}



const scrape = async searchText => {
  try {

    if (isNotDefined(COOKIE)) {
      throw "vinted requires a valid cookie";
    }

    const response = await fetch(`https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&time=1727382549&search_text=${searchText}&catalog_ids=&size_ids=&brand_ids=89162&status_ids=6,1&material_ids`, {
      "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "priority": "u=0, i",
        "sec-ch-ua": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "cookie": COOKIE
      },
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET"
    });

    if (response.ok) {
      const body = await response.json();

      return parse(body);
    }

    console.error(response);

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};


export {scrape};