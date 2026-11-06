i want to develop an app (aidopost.com), where the user can generate social media ready professional post photos , and use them to post photos.

 i will give you instructions about the app and you will send me the full description, sprints, user stories, tasks etc, so our engineer develops the app.
 
for us to be able to generate that photo, we are collecting these information from the user 
description on what they do (so we know/infer the industry) 
2-3 photos for the same item! (not not like 3 photos of different products) (to create the post photo of that very product)
style of the post (minimalist, casual, premium)

as an mvp the app should be integrated on the app website .
build the website in a very trendy style where there will also be the "try the app for free" button as CTA and then the app asks the user to sign up or login (also possibly with gmail or microsoft). the website/app  should be in 6 languages (English, Armenian, Arabic, German, Turkish, Sweddish, Spanish)
the free trial gives the user the ability to create 5 images , then offer lite or pro tiers (do the pricing and the features EXACTLY like renderforest). 

once landed in the app (studio where to produce the photos), the user gives info about their brand EITHER by writing (typing) (OR  writes the brand name or website or instagram or socials link) and we fetch data about their brand (in the language that they are working with!, if it is in armenian then description armenian, if english or arabic, then arabic)... when the description is written manually or "approved" by the user (in case we are fetching the info from elswhere), then we are asking them to upload 2-3 photos of the SMAE product they want to post on social media... then they click suggest photos and a loading bar appears in a very lighte style and cool information and animation etc.... 
  
here is now our secret souce in the backend.

we are calling claude to determine a couple of things: (parallel calls maybe, choose the best and fastest way) to determine:
1-varA=industry: from description we are assigning an industry (let us have in our db fixt 10 industries and assign the nearest), and if the user is logged in again they should re-use the save industry or create another one (so a new industry can be saved for the same user) 
2-varB=product) from the photo we are determining the product itself, is it a ring? perfume? tshirt etc.etc.
3-varC=style: taking the style selected 


once varA, varB and varC are ready we have the following tasks:
a)generating 3 prompts varPropmptA, varPromptB, varPropmptC (that will be used in gemeni ai together with the photos uploaded later on)  Each prompt EXPLICITELY tells the AI to keep the product varB exactly as it is and only build the scene around it (depending on the industry varA and the style varC)

1-we take the first prompt varPropmptA together with varB (the product photos) and  call gemeni ai photo generator, to create the photo, then the photo will be displayed to the user.


the user can download it (if it is free plan it can download medium quality photo or with ribbon (here you can again use the strategy that renderforst uses when downloading, i really love their way of handling things)
once the user is able to see/download the 1st photo, the UI should give him the chance to generate another one (the user should be informed that with given parameters (description, photo and style they can generate 3 different photos) , so once they click regenerate for the second photo , gemeni ai should be triggered now with these parameters: varPropmptB together with varB (the product photos), for the regeneration of the third photo the gemeni ai should be triggered with varPropmptC together with varB (the product photos).


let us do this thing together!!! 
