---
title: Polaron
tagline: >-
  High level, to the bare metal. An object-orientation-mandatory, manually memory-managed
  systems language that compiles to native code through LLVM.
repo: https://github.com/jvpts11/Polaron
language: C++
status: Compiler and toolchain working, 952 tests across five targets
order: 1
---

Polaron aims to be as fast as C and C++ while being safer by construction: value semantics, no
garbage collector, and no exploitable undefined behaviour. Bounds, division and casts are
checked or saturated rather than left undefined, and ownership and regions give control over
memory without a collector.

## The toolchain

`polaron` is the project driver and `polc` underneath it is the compiler. The loop is short:

```
polaron new hello
cd hello
polaron run
```

The other verbs are `build`, `test`, `check`, `fmt`, `doc`, `explain`, `plug` and `studio`.
Libraries are installed with `polaron plug <url>`, which fetches, compiles and records them in
`polaron.toml`, carrying their own link requirements inside the bundle.

## What runs today

The suite is 952 tests. Besides the host, Polaron builds for and executes on x86-64 Windows,
x86-64 Linux, an i686 kernel booted under QEMU and read back over the serial port, an aarch64
kernel over a PL011 UART, and wasm32 loaded in a real browser.

The compiler itself is C++20, CMake and LLVM 17+, and a Windows installer bundles a
self-contained toolchain that needs no Visual Studio on the target machine.

## Regions: many objects, one lifetime

A region is an arena you allocate once and hand out of. Everything built in it lives exactly as
long as the region does, and a region declares what it accepts, so putting the wrong type in it
is a compile error rather than a convention. From `examples/regions.pol`:

```polaron
region pen = itself.allocate(1 kilobytes).accepts({Dog});
Dog* a = new Dog(3) in region pen;
Dog* b = new Dog(7) in region pen;
Dog* c = new Dog(2) in region pen;
System.IO.Console.println($"the pack: {a.age()} {b.age()} {c.age()}");
// new Cat(9) in region pen; here is a COMPILE ERROR: the region said Dog.
release region pen;
```

The repository carries twenty-one complete examples, each compiled and run by the test suite and
checked against the output its own header promises.

## Ecosystem

[Polaron-OpenGL](https://github.com/jvpts11/Polaron-OpenGL) is the binding agents.exe plugs in
to draw its world.
