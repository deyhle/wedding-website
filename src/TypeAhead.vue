<template>
  <div>
    <div data-grid="">
      <div data-col="12">
        <div class="form-group" :class="[classes]">
          <label for="search">Titel suchen:</label>
          <div class="input-group">
            <div class="input-group__addon" style="border-radius: 1rem 0 0 1rem;">
              <div class="ec-icon find"></div>
            </div>
            <input name="search" id="search" type="text" class="type-ahead-select input"
                   :placeholder="placeholder"
                   autocomplete="off"
                   v-model="query"
                   @keydown.down="down"
                   @keydown.up="up"
                   @keydown.enter.prevent="hit"
                   @keydown.esc="reset"
                   @input="update($event)"/>
          </div>
        </div>
        <div v-show="hasItems" class="xui-list">
          <div v-for="(item , index) in items" class="xui-list-item">
            <div class="xui-list-item__start">
              <div class="avatar avatar_square">
                <img :src="item.album.images[0].url" :alt="item.album.name">
              </div>
            </div>
            <div class="xui-list-item__label">
              <strong>{{item.name}}</strong><br>
              <small>{{item.artists.map(artist => artist.name).join(', ')}}</small>
              <div v-if="item.type === 'preview'">
                <audio controls autoplay>
                  <source :src="item.preview_url" type="audio/mpeg">
                </audio>
              </div>
            </div>
            <div class="xui-list-item__end">
              <nav class="nav">
                <ul class="nav__items">
                  <li class="nav__item">
                    <a class="btn btn_small btn_minor is-nowrap" v-if="!isOnPlaylist(item)"
                       v-on:click="addTitle(item)">
                      + hinzufügen
                    </a>
                    <span v-if="isOnPlaylist(item)" data-tooltip-bottom="Titel ist auf der Playlist!">
                      ☑️</span>
                  </li>
                  <li class="nav__item" >
                    <a class="btn btn_clear" v-if="item.type === 'track'"
                       v-on:click="toggleShowPreview(item)">▶︎</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        <div v-if="showSearchingFlag" v-show="!hasItems&&!isEmpty">
          <span @mousemove="setActive(index)" v-if="!loading" class="align-center">
            <em v-html="NoResultText"></em>
          </span>
          <span @mousemove="setActive(index)" v-else class="align-center">
            <em v-html="SearchingText"></em>
          </span>
        </div>
        <div class="bumper"></div>
      </div>


      <div data-col="12">
        <header class="title has-margin-bottom">
          <h2 class="is-kilo">Aktuelle Wünsche-Playlist</h2>
          <a class="btn btn_minor btn_small"
             href="https://open.spotify.com/user/1124976920/playlist/5gd8s87gyQR4gctj5wkdo3?si=33ltExCXRMuyCcoszGxGiA">Playlist
            auf Spotify</a>
        </header>

        <div class="xui-list">
          <div class="xui-list-item" v-for="(item, index) in playlist">
            <div class="xui-list-item__start">
              <div class="avatar avatar_square">
                <img :src="item.track.album.images[0].url" :alt="item.track.album.name">
              </div>
            </div>
            <div class="xui-list-item__label">
              <strong>{{item.track.name}}</strong><br>
              <small>{{item.track.artists.map(artist => artist.name).join(', ')}}</small>
              <div v-if="item.track.type === 'preview'">
                <audio controls autoplay>
                  <source :src="item.track.preview_url" type="audio/mpeg">
                </audio>
              </div>
            </div>
            <div class="xui-list-item__end">
              <a v-if="item.track.type === 'track'" v-on:click="toggleShowPreview(item.track)"
                 class="btn btn_clear">▶</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
</style>
<script lang="babel">
  import axios from 'axios'
  export default{
    name: 'TypeAhead',
    props: {
      selectFirst: {
        // 是否选择第一个选项
        required: false,
        type: Boolean,
        default: false
      },
      queryParamName: {
        // 被替换的单词
        required: false,
        type: String,
        default: ':keyword'
      },
      limit: {
        // 最大显示量
        required: false,
        type: Number,
        default: 10
      },
      minChars: {
        // 最小进行查询的字符数量
        required: false,
        type: Number,
        default: 2
      },
      src: {
        // 请求地址
        required: false,
        type: String
      },
      delayTime: {
        // 发送延迟时间
        required: false,
        default: 500,
        type: Number
      },
      placeholder: {
        // 是否有placeholder
        required: false,
        type: String
      },
      showSearchingFlag: {
        // 是否显示搜索状态
        required: false,
        default: false,
        type: Boolean
      },
      NoResultText: {
        // 如果显示搜索状态，无结果的文本
        required: false,
        default: 'Keine Ergebnisse 😟',
        type: String
      },
      SearchingText: {
        // 如果显示搜索状态，搜索的文本
        required: false,
        default: 'Suche...',
        type: String
      },
      classes: {
        // 所给填写框增加的类
        required: false,
        type: String
      },
      value: {
        required: false,
        type: String,
        default: ''
      },
      onHit: {
        required: false,
        type: Function,
        default: function (item) {
          this.query = item
        }
      },

      highlighting: {
        // 高亮结果
        required: false,
        type: Function,
        default: function (item) {
          var re = new RegExp(this.query, 'ig');
          var matches = item.match(re);

          matches && matches.forEach(match => {
            item = item.replace(match, `<b>${match}</b>`)
          })

          return item
        }
      },

      render: {
        // 对结果进行处理
        required: false,
        type: Function,
        default: function (items) {
          return items
        }
      },

      getResponse: {
        // 如何处理得到的请求
        required: false,
        type: Function
      },

      addToPlaylist: {
        required: false,
        type: Function
      },

      getPlaylist: {
        required: false,
        type: Function
      },

      fetch: {
        // 如何获取数据
        required: false,
        type: Function,
        default: function (url) {
          return axios.get(url)
        }
      },

      objectArray: {
        required: false,
        type: Array
      }
    },
    async beforeMount() {
      this.playlist = await this.getPlaylist()
    },
    data () {
      return {
        items: [],
        query: '',
        current: -1,
        loading: false,
        lastTime: 0,
        data: [],
        playlist: [],
      }
    },
    methods: {
      isOnPlaylist(item) {
        return !!(this.playlist.find(({ track }) => track.uri === item.uri));
      },
      toggleShowPreview(item) {
        item.type = 'preview';
      },
      addTitle(item) {
        this.addToPlaylist(item.uri, item);
        this.playlist.unshift({ track: item });
      },
      objectUpdate (){
        var filtered = this.objectArray.filter(entity => entity.toLowerCase().includes(this.query.toLowerCase()));
        this.data = this.limit ? filtered.slice(0, this.limit) : filtered;
        this.items = this.render(this.limit ? this.data.slice(0, this.limit) : this.data, this)
        
        this.current = -1;

        if (this.selectFirst) {
          this.down()
        }


      },
      update (event) {
        this.lastTime = event.timeStamp
        if (!this.query) {
          return this.reset()
        }

        if (this.minChars && this.query.length < this.minChars) {
          return
        }
        // 添加的延时
        setTimeout(() => {
          if (this.lastTime - event.timeStamp === 0) {
            if(this.objectArray){
              return this.objectUpdate()
            }

            this.loading = true

            const re = new RegExp(this.queryParamName, 'g')

            this.fetch(this.src.replace(re, this.query)).then((response) => {
              if (this.query) {
                let data = this.getResponse(response)
                this.data = this.limit ? data.slice(0, this.limit) : data
                this.items = this.render(this.limit ? data.slice(0, this.limit) : data, this)

                this.current = -1
                this.loading = false

                if (this.selectFirst) {
                  this.down()
                }
              }
            })
          }
        }, this.delayTime)
      },

      setActive (index) {
        this.current = index
      },

      activeClass (index) {
        return this.current === index
      },

      hit () {
        if (this.current !== -1) {
          this.onHit(this.items[this.current], this, this.current)
        }
        this.reset()
      },

      up () {
        if (this.current > 0) {
          this.current--
        } else if (this.current === -1) {
          this.current = this.items.length - 1
        } else {
          this.current = -1
        }
        if (!this.selectFirst && this.current !== -1) {
          this.onHit(this.items[this.current], this)
        }
      },

      down () {
        if (this.current < this.items.length - 1) {
          this.current++
        } else {
          this.current = -1
        }
        if (!this.selectFirst && this.current !== -1) {
          this.onHit(this.items[this.current], this)
        }
      },

      reset: function () {
        this.items = []
        this.loading = false
      }

    },
    watch: {
      value: function (value) {
        this.query = this.query !== value ? value : this.query
      },
      query: function (value) {
        this.$emit('input', value)
      }
    },
    computed: {
      vue: function () {
        return this
      },
      hasItems () {
        return this.items.length > 0
      },

      isEmpty () {
        return this.query === ''
      }
    },

    mounted () {
      /***
       * 使得其点击之外的部分自动收起
       */
      document.addEventListener('click', (e) => {
        if (!this.$el.contains(e.target)) {
          this.reset()
        }
      })

      if(this.objectArray){
        this.objectArray.sort()
      }
    }
  }















</script>