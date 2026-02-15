import axios from 'axios';
import Config from './Config';
import { useLocation } from 'react-router-dom';

class api {
  constructor() {
    this.instance = axios.create({
      withCredentials: false,
      baseURL: Config.ledgerUrl,
    });
    this.authInstance = axios.create({
      withCredentials: false,
      baseURL: Config.authUrl || Config.ledgerUrl,
    });

    this.instance.interceptors.request.use(
      (res) => {
        res.headers['platform'] = 'web';
        return res;
      },
      (err) => {
        return Promise.reject(err);
      }
    );

    const onResponse = (
      (res) => res,
      (err) => {
        if (err.response && err.response.status === 403) {
          const his = useLocation();
          his.push('/login');
          window.location.reload();
        }
        return Promise.reject(err);
      }
    );
    this.instance.interceptors.response.use(onResponse);
    this.authInstance.interceptors.response.use(onResponse);
  }

  get(url, options, authOff = false) {
    const headers = authOff ? {} : this.getAuthHeaders();
    const inst = (url.startsWith('common/') || url.startsWith('mongo/')) ? this.authInstance : this.instance;
    return new Promise((resolve, reject) => {
      inst
        .get(url, { ...options, headers })
        .then((response) => resolve(response))
        .catch((error) => reject(error));
    });
  }

  post(url, data, headers = {}, authOff = false) {
    const newHeaders = authOff ? headers : { ...headers, ...this.getAuthHeaders() };
    const inst = (url.startsWith('common/') || url.startsWith('mongo/')) ? this.authInstance : this.instance;
    return inst.post(url, data, { headers: newHeaders });
  }

  put(url, data, headers = {}, authOff = false) {
    const newHeaders = authOff ? headers : { ...headers, ...this.getAuthHeaders() };
    const inst = (url.startsWith('common/') || url.startsWith('mongo/')) ? this.authInstance : this.instance;
    return inst.put(url, data, { headers: newHeaders });
  }

  delete(url, options, authOff = false) {
    const headers = authOff ? {} : this.getAuthHeaders();
    const inst = (url.startsWith('common/') || url.startsWith('mongo/')) ? this.authInstance : this.instance;
    return inst.delete(url, { headers, ...options });
  }

  getAuthHeaders() {
    const access_token = localStorage.getItem('userToken');
    return {
      'X-Requested-With': 'XMLHttpRequest',
      Authorization: `Bearer ${access_token}`,
    };
  }
}

export default new api();
