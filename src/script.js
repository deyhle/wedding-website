import Vue from 'vue';
import VueResource from 'vue-resource';
import VueCookies from 'vue-cookies';
import TypeAhead from './TypeAhead.vue';

import './../style/style.scss'; // load styles into webpack dependency tree

Vue.use(VueResource);
Vue.use(VueCookies);
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// register
Vue.component('rsvp-component', {
  data: () => ({
    guestsJSON: window.guests,
    saved: true,
    saving: false,
  }),
  watch: {
    saved() {
      if (!this.saved) {
        setTimeout(async () => {
          if (!this.saved) {
            console.log('saving');
            this.saving = true;
            try {
              await Promise.all(this.guestsJSON.map(this.save));
              this.saved = true;
              this.saving = false;
              console.log('saved');
            } catch (error) {
              console.error(error);
            }
          }
        }, 2000);
      }
    },
  },
  methods: {
    async save(guest) {
      try {
        const response = await this.$http.put(
          guest._links.self[0].href,
          Object.assign({}, guest, { 
            overnight: guest.overnight ? 1 : -1,
            email: guest.email && emailRegex.test(guest.email) ? guest.email : null,
          }),
          {
            headers:
              {
                Authorization: `Bearer ${this.$cookies.get('auth')}`,
              },
          },
        );
        if (response.status !== 200) {
          console.error(`response_${response.status}`);
        }
      } catch (e) {
        console.error(e);
      }
    },
    async saveAll() {
      if (this.saved) { // fake save
        this.saved = false;
        this.saving = true;
        await new Promise(resolve => setTimeout(() => {
          this.saved = true;
          this.saving = false;
          resolve();
        }, 700));
      } else {
        try {
          this.saving = true;
          await Promise.all(this.guestsJSON.map(this.save));
          this.saving = false;
          this.saved = true;
        } catch (error) {
          console.error(error); 
          // window.location.href = `/rsvp?error=${error.message}`;
        }
      }
    },
  },
});

Vue.component('spotify', {
  data: () => ({
    message: 'spotify',
  }),
  methods: {
    getResponse(url) {
      return url.data;
    },
    highlighting(item, vue) {
      return item;
      //return item.name.replace(vue.query, `<b>${vue.query}</b>`)
    },
    async addToPlaylist(spotifyURI, item) {
      const response = await this.$http.post(`/music-add/${spotifyURI}`);

      this.playlist = await this.getPlaylist();
/* nur benötigt, wenn die Musikwünsche zusätzlich im Data Manager gespeichert werden sollen,
um nachzuvollziehen, welcher code sich was gewünscht hat
      const responseDM = await this.$http.post(
        'https://datamanager.entrecode.de/api/dee3f1ff/music', // todo configurable
        Object.assign({}, { title: item.name, artist: item.artists.map(a => a.name).join(', ') }),
        {
          headers:
            {
              Authorization: `Bearer ${this.$cookies.get('auth')}`,
            },
        },
      );*/
      
    },
    async getPlaylist() {
      const response = await this.$http.get(`/music-get`);
      return response.body.items || [];
    },
  },
  components: {
    typeahead: TypeAhead,
  },
});

const app = new Vue({
  el: '#app',
  data: {
    toggleMenu: false,
  },
});

