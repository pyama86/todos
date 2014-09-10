# Place all the behaviors and hooks related to the matching controller here.
# All @logic will automatically be available in application.js.
# You can use CoffeeScript in @file: http:#coffeescript.org/
_.templateSettings = 
  interpolate: /\{\{(.+?)\}\}/g
  evaluate: /\{%(.+?)%\}/g
  escape: /\{%-(.+?)%\}/g

#document on read
$ ->
  #モデルの作成
  class Todo extends Backbone.Model
    defaults: -> 
      title: "empty todo..."
      order: Todos.nextOrder()
      done: false
    toggle: -> 
      @save({done: !@get("done")})

  #コレクションの作成
  class TodoList extends Backbone.Collection
    model: Todo,
    localStorage: new Backbone.LocalStorage("todos-backbone")
    
    # 処理済みtodoの取得 
    done: -> 
      @where({done: true})
    remaining: -> 
      @where({done: false})
    
    #次レコードの取得
    nextOrder: -> 
      return 1 if !@length
      @last().get('order') + 1
    
    #ソートのロジックの設定
    comparator: 'order'
  
  Todos = new TodoList

  #todo描画ビューの作成
  class TodoView extends Backbone.View
  
    #liタグにひもづける
    tagName:  "li"
    
    #templateの定義 index.html.erb内のtemplateを使用する
    template: _.template($('#item-template').html())
    
    # jqueryイベントを定義する 
    events:
      "click .toggle"   : "toggleDone"
      "dblclick .view"  : "edit"
      "click a.destroy" : "clear"
      "keypress .edit"  : "updateOnEnter"
      "blur .edit"      : "close"
    
    #初期化処理
    #変更と削除をリッスンする
    initialize: ->
      @listenTo(@model, 'change', @render)
      @listenTo(@model, 'destroy', @remove)
    
    # 再描画 
    render: -> 
      @$el.html(@template(@model.toJSON()))
      @$el.toggleClass('done', @model.get('done'))
      @input = @$('.edit')
      this
    
    # 削除フラグの状態反映 
    toggleDone: ->
      @model.toggle()

    # 編集時のクラス追加　多分デザインをCSSで換えている
    edit: -> 
      @$el.addClass("editing")
      @input.focus()

    #保存、終了処理
    close: -> 
      value = @input.val()
      if !value 
        @clear()
      else 
        @model.save({title: value})
        @$el.removeClass("editing")
    
    #エンター押下
    updateOnEnter: (e) -> 
      @close() if (e.keyCode ==13)

    #削除処理
    clear: -> 
      @model.destroy()

  #クリアボタンとかアプリ周りのビュー
  class AppView extends Backbone.View
    #todappにバインドする
    el: $("#todoapp")
    #テンプレートはindex.html.erb内のstats-templateを利用
    statsTemplate: _.template($('#stats-template').html())

    #イベントをリッスンする
    events: 
      "keypress #new-todo":  "createOnEnter"
      "click #clear-completed": "clearCompleted"
      "click #toggle-all": "toggleAllComplete"

    #初期化処理でオブジェクトのバインド、
    #リッスンの追加を行う
    initialize: ->
      @input = @$("#new-todo")
      @allCheckbox = @$("#toggle-all")[0]
      @listenTo(Todos, 'add', @addOne)
      @listenTo(Todos, 'reset', @addAll)
      @listenTo(Todos, 'all', @render)
      @footer = @$('footer')
      @main = $('#main')
      Todos.fetch()

    #再描画
    render: -> 
      done = Todos.done().length
      remaining = Todos.remaining().length

      if Todos.length
        @main.show()
        @footer.show()
        @footer.html(@statsTemplate({done: done, remaining: remaining}))
      else 
        @main.hide()
        @footer.hide()

      @allCheckbox.checked = !remaining

    #todoの1行追加
    addOne: (todo) ->
      view = new TodoView({model: todo})
      @$("#todo-list").append(view.render().el)
    
    #最初に開いた際にモデルからすべて読み込む
    addAll: -> 
      Todos.each(@addOne,@)
    
    #エンター押下
    #モデルへレオk-土を作成する
    createOnEnter: (e)-> 
      return if e.keyCode != 13
      return if !@input.val()

      Todos.create({title: @input.val()})
      @input.val('')
    
    clearCompleted: -> 
      _.invoke(Todos.done(), 'destroy')
      false
    
    #全チェック処理
    toggleAllComplete: -> 
      done = @allCheckbox.checked
      Todos.each(
        (todo)->
          todo.save({'done': done}) 
      )
  
  # Finally, we kick things off by creating the **App**.
  App = new AppView

