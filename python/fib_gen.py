count = 0

def fib(max):
  nonlocal count
  a, b = 0, 1
  count += 1
  while a < max:
    yield a
    a, b = b, a + b
    count += 1

gen = fib(12)
print(next(gen)) #this system call should contain all the side effects of fib. 
print(next(gen)) #focusing on next should get us to internals of fib
for i in gen: # implicit calls to next
  print(i)