// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

//レンダリング時にエラーとなるため、
//テンプレートのエスケープ文字を変更する
//backbone.js 1193
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g,
  evaluate: /\{%(.+?)%\}/g,
  escape: /\{%-(.+?)%\}/g
};

$(function(){

  // Todo Model
  // ----------

  //モデルの作成
  var Todo = Backbone.Model.extend({

    // Default attributes for the todo item.
    defaults: function() {
      return {
        title: "empty todo...",
        order: Todos.nextOrder(),
        done: false
      };
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    }

  });

  // Todo Collection
  // ---------------
  //コレクションの作成
  var TodoList = Backbone.Collection.extend({

    model: Todo,

    localStorage: new Backbone.LocalStorage("todos-backbone"),
    //
    // 処理済みtodoの取得 
    //
    done: function() {
      return this.where({done: true});
    },

    remaining: function() {
      return this.where({done: false});
    },

    //次レコードの取得
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    //ソートのロジックの設定
    comparator: 'order'

  });

  // オブジェクトの代入
  var Todos = new TodoList;


  //todo描画ビューの作成
  var TodoView = Backbone.View.extend({

    //liタグにひもづける
    tagName:  "li",

    //templateの定義 index.html.erb内のtemplateを使用する
    template: _.template($('#item-template').html()),

    // jqueryイベントを定義する 
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .view"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },

    //初期化処理
    //変更と削除をリッスンする
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
      this.listenTo(this.model, 'destroy', this.remove);
    },

    // 再描画 
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },

    // 削除フラグの状態反映 
    toggleDone: function() {
      this.model.toggle();
    },

    // 編集時のクラス追加　多分デザインをCSSで換えている
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },

    //保存、終了処理
    close: function() {
      var value = this.input.val();
      if (!value) {
        this.clear();
      } else {
        this.model.save({title: value});
        this.$el.removeClass("editing");
      }
    },

    //エンター押下
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    //削除処理
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  //クリアボタンとかアプリ周りのビュー
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.

    //todappにバインドする
    el: $("#todoapp"),

    //テンプレートはindex.html.erb内のstats-templateを利用
    statsTemplate: _.template($('#stats-template').html()),

    //イベントをリッスンする
    events: {
      "keypress #new-todo":  "createOnEnter",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },

    //初期化処理でオブジェクトのバインド、
    //リッスンの追加を行う
    initialize: function() {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Todos, 'add', this.addOne);
      this.listenTo(Todos, 'reset', this.addAll);
      this.listenTo(Todos, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');
      
      Todos.fetch();
    },

    //再描画
    render: function() {
      var done = Todos.done().length;
      var remaining = Todos.remaining().length;

      if (Todos.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining;
    },

    //todoの1行追加
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    //最初に開いた際にモデルからすべて読み込む
    addAll: function() {
      Todos.each(this.addOne, this);
    },

    //エンター押下
    //モデルへレオk-土を作成する
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      Todos.create({title: this.input.val()});
      this.input.val('');
    },

    //全削除処理
    /*
      invoke_.invoke(list, methodName, [*arguments]) 
      list. の中のそれぞれの値に対して methodName で指名されたメソッドをコールします
      invoke に渡される他の引数はメソッド呼び出しに転送されます。
    */
    clearCompleted: function() {
      _.invoke(Todos.done(), 'destroy');
      return false;
    },
    //全チェック処理
    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    }

  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;

});
