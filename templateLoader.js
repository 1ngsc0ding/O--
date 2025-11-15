export async function loadTemplate(url){
  try {
    const res = await fetch(url);
    if(!res.ok) throw new Error("Failed to load template");
    const template = await res.json();
    return template;
  } catch(err){
    console.error(err);
    return null;
  }
}
