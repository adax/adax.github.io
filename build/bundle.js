
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.30.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.30.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i].item;
    	child_ctx[23] = list[i].itemId;
    	child_ctx[24] = list;
    	child_ctx[25] = i;
    	return child_ctx;
    }

    // (65:0) {:catch error}
    function create_catch_block_1(ctx) {
    	let t0;
    	let t1_value = /*error*/ ctx[26] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("Error! ");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*authPromise*/ 2 && t1_value !== (t1_value = /*error*/ ctx[26] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(65:0) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (39:30) {:then _}
    function create_then_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*userObject*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(39:30) {:then _}",
    		ctx
    	});

    	return block;
    }

    // (49:1) {:else}
    function create_else_block(ctx) {
    	let h1;
    	let t0;
    	let t1_value = /*userObject*/ ctx[0].username + "";
    	let t1;
    	let t2;
    	let t3;
    	let button;
    	let t5;
    	let await_block_anchor;
    	let promise;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block,
    		value: 21,
    		error: 26
    	};

    	handle_promise(promise = /*todoPromise*/ ctx[4], info);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text("Hi, ");
    			t1 = text(t1_value);
    			t2 = text("!");
    			t3 = space();
    			button = element("button");
    			button.textContent = "Log out";
    			t5 = space();
    			await_block_anchor = empty();
    			info.block.c();
    			add_location(h1, file, 49, 2, 1542);
    			set_style(button, "position", "absolute");
    			set_style(button, "top", "10px");
    			set_style(button, "right", "10px");
    			add_location(button, file, 50, 2, 1580);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*signOut*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*userObject*/ 1 && t1_value !== (t1_value = /*userObject*/ ctx[0].username + "")) set_data_dev(t1, t1_value);
    			info.ctx = ctx;

    			if (dirty & /*todoPromise*/ 16 && promise !== (promise = /*todoPromise*/ ctx[4]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[21] = child_ctx[26] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(49:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:1) {#if !userObject}
    function create_if_block(ctx) {
    	let form;
    	let label0;
    	let t1;
    	let input0;
    	let br0;
    	let t2;
    	let label1;
    	let t4;
    	let input1;
    	let br1;
    	let t5;
    	let button0;
    	let t7;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			label0 = element("label");
    			label0.textContent = "Username";
    			t1 = space();
    			input0 = element("input");
    			br0 = element("br");
    			t2 = space();
    			label1 = element("label");
    			label1.textContent = "Password";
    			t4 = space();
    			input1 = element("input");
    			br1 = element("br");
    			t5 = space();
    			button0 = element("button");
    			button0.textContent = "Sign in";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "Sign up";
    			attr_dev(label0, "for", "username");
    			add_location(label0, file, 41, 2, 1196);
    			attr_dev(input0, "id", "username");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file, 42, 2, 1237);
    			add_location(br0, file, 42, 57, 1292);
    			attr_dev(label1, "for", "password");
    			add_location(label1, file, 43, 2, 1299);
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "type", "password");
    			add_location(input1, file, 44, 2, 1340);
    			add_location(br1, file, 44, 61, 1399);
    			attr_dev(button0, "type", "button");
    			add_location(button0, file, 45, 2, 1406);
    			attr_dev(button1, "type", "button");
    			add_location(button1, file, 46, 2, 1465);
    			add_location(form, file, 40, 1, 1187);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(form, t1);
    			append_dev(form, input0);
    			set_input_value(input0, /*username*/ ctx[2]);
    			append_dev(form, br0);
    			append_dev(form, t2);
    			append_dev(form, label1);
    			append_dev(form, t4);
    			append_dev(form, input1);
    			set_input_value(input1, /*password*/ ctx[3]);
    			append_dev(form, br1);
    			append_dev(form, t5);
    			append_dev(form, button0);
    			append_dev(form, t7);
    			append_dev(form, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[13]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[14]),
    					listen_dev(button0, "click", /*signIn*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*signUp*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*username*/ 4 && input0.value !== /*username*/ ctx[2]) {
    				set_input_value(input0, /*username*/ ctx[2]);
    			}

    			if (dirty & /*password*/ 8 && input1.value !== /*password*/ ctx[3]) {
    				set_input_value(input1, /*password*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:1) {#if !userObject}",
    		ctx
    	});

    	return block;
    }

    // (61:2) {:catch error}
    function create_catch_block(ctx) {
    	let t0;
    	let t1_value = /*error*/ ctx[26] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("Error!");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todoPromise*/ 16 && t1_value !== (t1_value = /*error*/ ctx[26] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(61:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (52:38) {:then _}
    function create_then_block_1(ctx) {
    	let label;
    	let t1;
    	let input;
    	let t2;
    	let button;
    	let br;
    	let t4;
    	let each_1_anchor;
    	let mounted;
    	let dispose;
    	let each_value = /*todos*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			label.textContent = "New Todo";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Add Todo";
    			br = element("br");
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(label, "for", "new-todo");
    			add_location(label, file, 52, 3, 1726);
    			attr_dev(input, "id", "new-todo");
    			attr_dev(input, "type", "text");
    			add_location(input, file, 53, 3, 1768);
    			add_location(button, file, 54, 3, 1826);
    			add_location(br, file, 54, 47, 1870);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*newTodo*/ ctx[6]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[15]),
    					listen_dev(button, "click", /*addTodo*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newTodo*/ 64 && input.value !== /*newTodo*/ ctx[6]) {
    				set_input_value(input, /*newTodo*/ ctx[6]);
    			}

    			if (dirty & /*deleteTodo, todos, updateTodo*/ 6176) {
    				each_value = /*todos*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(52:38) {:then _}",
    		ctx
    	});

    	return block;
    }

    // (57:3) {#each todos as {item, itemId}
    function create_each_block(ctx) {
    	let input;
    	let t0;
    	let button;
    	let br;
    	let mounted;
    	let dispose;

    	function input_input_handler_1() {
    		/*input_input_handler_1*/ ctx[16].call(input, /*index*/ ctx[25]);
    	}

    	function blur_handler() {
    		return /*blur_handler*/ ctx[17](/*index*/ ctx[25]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[18](/*itemId*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "X";
    			br = element("br");
    			attr_dev(input, "type", "text");
    			add_location(input, file, 57, 4, 1922);
    			add_location(button, file, 58, 4, 2011);
    			add_location(br, file, 58, 58, 2065);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*todos*/ ctx[5][/*index*/ ctx[25]].item);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			insert_dev(target, br, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", input_input_handler_1),
    					listen_dev(input, "blur", blur_handler, false, false, false),
    					listen_dev(button, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*todos*/ 32 && input.value !== /*todos*/ ctx[5][/*index*/ ctx[25]].item) {
    				set_input_value(input, /*todos*/ ctx[5][/*index*/ ctx[25]].item);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(57:3) {#each todos as {item, itemId}",
    		ctx
    	});

    	return block;
    }

    // (52:22) Loading todos...{:then _}
    function create_pending_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading todos...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(52:22) Loading todos...{:then _}",
    		ctx
    	});

    	return block;
    }

    // (39:20) Loading...{:then _}
    function create_pending_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(39:20) Loading...{:then _}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let await_block_anchor;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block_1,
    		value: 21,
    		error: 26
    	};

    	handle_promise(promise = /*authPromise*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*authPromise*/ 2 && promise !== (promise = /*authPromise*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[21] = child_ctx[26] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const databaseName = "todos";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let userObject = null;
    	const userbase = window.userbase;

    	let authPromise = userbase.init({
    		appId: "bb773775-0061-4e96-a55e-76b92b809369"
    	}).then(({ user }) => $$invalidate(0, userObject = user));

    	// auth	
    	let username, password;

    	const signIn = () => $$invalidate(1, authPromise = userbase.signIn({ username, password }).then(user => $$invalidate(0, userObject = user)));
    	const signUp = () => $$invalidate(1, authPromise = userbase.signUp({ username, password }).then(user => $$invalidate(0, userObject = user)));
    	const signOut = () => $$invalidate(1, authPromise = userbase.signOut().then($$invalidate(0, userObject = null)));

    	// db
    	let todoPromise;

    	let todos = [], newTodo = "";

    	function changeHandler(items) {
    		$$invalidate(5, todos = items);
    	}

    	function addTodo() {
    		$$invalidate(4, todoPromise = userbase.insertItem({ databaseName, item: newTodo }));
    		$$invalidate(6, newTodo = "");
    	}

    	function deleteTodo(itemId) {
    		$$invalidate(4, todoPromise = userbase.deleteItem({ databaseName, itemId }));
    	}

    	function updateTodo(index) {
    		const { item, itemId } = todos[index];
    		$$invalidate(4, todoPromise = userbase.updateItem({ databaseName, itemId, item }));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(2, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(3, password);
    	}

    	function input_input_handler() {
    		newTodo = this.value;
    		$$invalidate(6, newTodo);
    	}

    	function input_input_handler_1(index) {
    		todos[index].item = this.value;
    		$$invalidate(5, todos);
    	}

    	const blur_handler = index => updateTodo(index);
    	const click_handler = itemId => deleteTodo(itemId);

    	$$self.$capture_state = () => ({
    		userObject,
    		userbase,
    		authPromise,
    		username,
    		password,
    		signIn,
    		signUp,
    		signOut,
    		todoPromise,
    		todos,
    		newTodo,
    		databaseName,
    		changeHandler,
    		addTodo,
    		deleteTodo,
    		updateTodo
    	});

    	$$self.$inject_state = $$props => {
    		if ("userObject" in $$props) $$invalidate(0, userObject = $$props.userObject);
    		if ("authPromise" in $$props) $$invalidate(1, authPromise = $$props.authPromise);
    		if ("username" in $$props) $$invalidate(2, username = $$props.username);
    		if ("password" in $$props) $$invalidate(3, password = $$props.password);
    		if ("todoPromise" in $$props) $$invalidate(4, todoPromise = $$props.todoPromise);
    		if ("todos" in $$props) $$invalidate(5, todos = $$props.todos);
    		if ("newTodo" in $$props) $$invalidate(6, newTodo = $$props.newTodo);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*userObject*/ 1) {
    			 console.log(userObject);
    		}

    		if ($$self.$$.dirty & /*userObject*/ 1) {
    			 if (userObject) $$invalidate(4, todoPromise = userbase.openDatabase({ databaseName, changeHandler }));
    		}
    	};

    	return [
    		userObject,
    		authPromise,
    		username,
    		password,
    		todoPromise,
    		todos,
    		newTodo,
    		signIn,
    		signUp,
    		signOut,
    		addTodo,
    		deleteTodo,
    		updateTodo,
    		input0_input_handler,
    		input1_input_handler,
    		input_input_handler,
    		input_input_handler_1,
    		blur_handler,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
