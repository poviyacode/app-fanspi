import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CountryService } from './country.service';
import { User } from '@interfaces/user';
import { StorageService } from './storage.service';
import { Post } from '@interfaces/post';

@Injectable({
  providedIn: 'root'
})
export class ToolsService {

  ipapiRes: any;

  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  ipapiGet(): Observable<object[]> {
    //console.log(1)
    // fanspi@hotmail.com -> bb4ba6f682fa9fe4dddc8b2d191e82f9

    const url = `http://api.ipapi.com/161.185.160.93?access_key=b30611b72dd2489347c83080c100a624`;
    return this.http.get<any[]>(url)
      .pipe(
        tap(resp => {
          //this.ipapiRes = JSON.stringify(resp!);
          //localStorage.setItem('ipapi', this.ipapiRes);
        }),
        map(resp => resp),
        catchError(err => of(err.error.msg))
      );
  }

  get ipapiDefault() {
    return {
      ip: '181.115.131.227',
      type: 'ipv4',
      city: "Oruro",
      continent_code: "SA",
      continent_name: "South America",
      country_code: "BO",
      country_name: "Bolivia",
      latitude: -17.942869186401367,
      "location": {
        "geoname_id": 5110302,
        "capital": "Washington D.C.",
        "languages": [
          {
            "code": "en",
            "name": "English",
            "native": "English"
          }
        ],
        "country_flag": "http://assets.ipapi.com/flags/us.svg",
        "country_flag_emoji": "🇺🇸",
        "country_flag_emoji_unicode": "U+1F1FA U+1F1F8",
        "calling_code": "1",
        "is_eu": false
      },
      "time_zone": {
        "id": "America/New_York",
        "current_time": "2018-09-24T05:07:10-04:00",
        "gmt_offset": -14400,
        "code": "EDT",
        "is_daylight_saving": true
      },
      "currency": {
        "code": "USD",
        "name": "US Dollar",
        "plural": "US dollars",
        "symbol": "$",
        "symbol_native": "$"
      },
      "connection": {
        "asn": 22252,
        "isp": "The City of New York"
      },
      "security": {
        "is_proxy": false,
        "proxy_type": null,
        "is_crawler": false,
        "crawler_name": null,
        "crawler_type": null,
        "is_tor": false,
        "threat_level": "low",
        "threat_types": null
      }
    }
  }

  //--- signals
  public readonly ipapi = signal<null>(this.storageService.loadFromStorage<null>('ipapi', null));

  addIpapi(value: any) {
    this.storageService.saveToStorage('ipapi', value);
    this.ipapi.set(value);
  }

  resetIpapi() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('ipapi');
    }
    this.ipapi.set(null);
  }

  get countryValidate() {
    if (localStorage.getItem('country')) {
      return true;
    } else {
      return false;
    }
  }

  countryCurrentCreate(country: string) {
    return localStorage.setItem('country_current', country);
  }

  get countryCurrent() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const countryCurrent = localStorage.getItem('country_current');
      return countryCurrent !== null ? countryCurrent : ''; // Retorna el valor o una cadena vacía si no está definido
    }
    return ''; // En caso de que 'window' o 'localStorage' no estén definidos
  }

  countryCreate(country: any) {
    return localStorage.setItem('country', country);
  }

  get country() {
    console.log(localStorage.getItem('country')!);
    if (localStorage.getItem('country') !== 'undefined') {
      console.log('yes');
      //return JSON.parse(localStorage.getItem('country')!);
      return null;
    } else {
      return null;
    }
  }

  categoryCreate(country: any) {
    return localStorage.setItem('country', country);
  }

  get catatoryAll() {
    //console.log(2)
    return JSON.parse(localStorage.getItem('country')!);
  }

  languageCreate(data: string) {
    localStorage.setItem('language', data);
  }

  language() {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('language');
    }
    return '';
  }

  createStart(data: any): Observable<any[]> {
    return this.http.post<any[]>(environment.api + 'geo/start', data);
  }

  // ipify
  getIpAddress() {
    return this.http.get('https://api.ipify.org?format=json');
  }

  // head
  headMobil = signal(true);

  addHeadMobil(value: boolean) {
    this.headMobil.set(value);
  }

  encryptData(data: any) {
    const secretKey = 'your-secret-key';
    // Convertir datos a JSON y luego encriptar con XOR
    const jsonData = JSON.stringify(data);
    const encryptedData = this.xorEncryptDecrypt(jsonData, secretKey);

    // Codificar en Base64 para que sea seguro en la URL
    const encodedData = btoa(encryptedData);
    return encodedData;
  }

  xorEncryptDecrypt(input: string, key: string): string {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      result += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  //image
  getFirstLetter(name: string): string {
    if (!name) {
      return '';
    }
    // Filtra los caracteres no alfabéticos y retorna la primera letra encontrada
    const firstAlphaChar = name.match(/[a-zA-Z]/);
    return firstAlphaChar ? firstAlphaChar[0].toUpperCase() : '';
  }

  getProfileImageUrl(user: User): string {

    const userProfile = user!;
    if (!userProfile || !userProfile.Profile || userProfile.Profile.length === 0) {
      return '';
    }

    const profile = userProfile.Profile[0];
    if (profile.cloudflare && profile.cloudflare.result && profile.cloudflare.result.variants && profile.cloudflare.result.variants.length > 0) {
      return profile.cloudflare.result.variants[0];
    }
    return profile.url || '';
  }

  getPostImageUrl(post: Post): string {

    if (!post || !post.PostMedia || post.PostMedia.length === 0) {
      return '';
    }

    const postMedia = post.PostMedia[0];
    if (postMedia.cloudflare && postMedia.cloudflare.result && postMedia.cloudflare.result.variants && postMedia.cloudflare.result.variants.length > 0) {
      return postMedia.cloudflare.result.variants[0];
    }
    return postMedia.url || '';
  }

  getPostVideoThumbnailUrl(post: Post): string {

    if (!post || !post.PostMedia || post.PostMedia.length === 0) {
      return '';
    }

    const postMedia = post.PostMedia[0];
    if (postMedia.cloudflare && postMedia.cloudflare.result && postMedia.cloudflare.result.thumbnail) {
      return postMedia.cloudflare.result.thumbnail;
    }
    return postMedia.url || '';
  }

}
